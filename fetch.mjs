// Pulls the Helios repertoire for today + the next two days, matches films to
// IMDb (TMDB for the id, the official IMDb datasets for the score), reads live
// seat occupancy for today's screenings and writes data.json for build.mjs.
//
//   TMDB_API_KEY=… node fetch.mjs
//
// Without TMDB_API_KEY only films already present in imdb-cache.json get a rating.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const API = 'https://restapi.helios.pl/api';
const UA = 'nacodokina.pl (kontakt@nacodokina.pl)';
const CONCURRENCY = 4;
const DAYS = 3;
const TZ = 'Europe/Warsaw';
const TMDB_KEY = process.env.TMDB_API_KEY;
const CACHE_DIR = new URL('./.cache/', import.meta.url);
const RATINGS_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz';
const RATINGS_MAX_AGE_H = 20;

const now = new Date();
const dayKey = d => d.toLocaleDateString('sv-SE', { timeZone: TZ });
const days = Array.from({ length: DAYS }, (_, i) => dayKey(new Date(now.getTime() + i * 86_400_000)));

const get = async (url, opts = {}) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, Accept: 'application/json', ...opts.headers } });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }
};

const pool = async (items, fn) => {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  }));
};

// ---------- 1. cinemas, screenings, movies ----------
console.error(`Helios · ${days[0]} → ${days.at(-1)}`);
const [cinemasRaw, screeningsRaw, moviesRaw] = await Promise.all([
  get(`${API}/cinema`),
  get(`${API}/screening?dateTimeFrom=${days[0]}T00:00:00.000&dateTimeTo=${days.at(-1)}T23:59:59.999`),
  get(`${API}/movie`),
]);
console.error(`${cinemasRaw.length} cinemas, ${screeningsRaw.length} screenings, ${moviesRaw.length} movies`);

const cinemas = Object.fromEntries(cinemasRaw.map(c => [c.id, {
  // "GORZÓW WLKP. Galeria Askana" → "Galeria Askana"; the city is a separate field anyway.
  id: c.id, name: c.name.replace(/^(?:[A-ZĄĆĘŁŃÓŚŹŻ.\-]{2,}\s+)+/, '').trim() || c.name, city: c.city,
  lat: c.latitude, lon: c.longitude, street: c.street, screens: c.numberOfScreens,
}]));

const movieById = Object.fromEntries(moviesRaw.map(m => [m.id, m]));
const usedMovieIds = [...new Set(screeningsRaw.map(s => s.movieId))].filter(id => movieById[id]);

// ---------- 2. IMDb id via TMDB (cached forever), score via IMDb datasets (daily) ----------
const cachePath = new URL('./imdb-cache.json', import.meta.url);
let imdbCache = {};
try { imdbCache = JSON.parse(await readFile(cachePath, 'utf8')); } catch {}

// Helios print names like "Odisseya - UA" are Ukrainian-dubbed prints of the same film.
const cleanTitle = t => (t ?? '').replace(/\s*-\s*UA$/i, '').replace(/\s*\(re-release\)/i, '').replace(/\s*-\s*Re-release$/i, '').trim();

const tmdb = (path, params) => get(`https://api.themoviedb.org/3${path}?${new URLSearchParams({ api_key: TMDB_KEY, ...params })}`);
const matchViaTmdb = async m => {
  const year = parseInt(m.yearOfProduction) || undefined;
  for (const q of [...new Set([cleanTitle(m.originalTitle), cleanTitle(m.title)].filter(Boolean))]) {
    const res = (await tmdb('/search/movie', { query: q, ...(year ? { year } : {}), include_adult: 'false' })).results ?? [];
    const pick = res.find(r => year && r.release_date?.startsWith(String(year)))
      ?? res.find(r => year && Math.abs(parseInt(r.release_date) - year) <= 1)
      ?? (year ? null : res[0]);
    if (!pick) continue;
    const ext = await tmdb(`/movie/${pick.id}/external_ids`, {});
    if (!ext.imdb_id) continue;
    return { id: ext.imdb_id, tmdbId: pick.id, title: pick.title, year: parseInt(pick.release_date) || null, poster: pick.poster_path ? `https://image.tmdb.org/t/p/w342${pick.poster_path}` : null };
  }
  return null;
};

// title.ratings.tsv.gz: ~7 MB, refreshed daily by IMDb
const ratingsFile = new URL('title.ratings.tsv.gz', CACHE_DIR);
const loadRatings = async wanted => {
  await mkdir(CACHE_DIR, { recursive: true });
  let fresh = false;
  try { fresh = (Date.now() - (await stat(ratingsFile)).mtimeMs) < RATINGS_MAX_AGE_H * 3_600_000; } catch {}
  if (!fresh) {
    console.error('downloading IMDb ratings dataset…');
    const r = await fetch(RATINGS_URL, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`${r.status} ${RATINGS_URL}`);
    await pipeline(Readable.fromWeb(r.body), createWriteStream(ratingsFile));
  }
  const out = {};
  const rl = createInterface({ input: createReadStream(ratingsFile).pipe(createGunzip()) });
  for await (const line of rl) {
    const tab = line.indexOf('\t');
    const id = line.slice(0, tab);
    if (!wanted.has(id)) continue;
    const [rating, votes] = line.slice(tab + 1).split('\t');
    out[id] = { rating: parseFloat(rating), votes: parseInt(votes) };
    if (Object.keys(out).length === wanted.size) break;
  }
  return out;
};

for (const id of usedMovieIds) {
  if (id in imdbCache) continue;
  const m = movieById[id];
  if (!TMDB_KEY) { console.error(`no TMDB_API_KEY — skipping "${m.title.trim()}"`); continue; }
  try { imdbCache[id] = await matchViaTmdb(m); } catch (e) { console.error(`tmdb ${m.title.trim()}: ${e.message}`); continue; }
  console.error(`tmdb  ${m.title.trim()} → ${imdbCache[id] ? `${imdbCache[id].title} (${imdbCache[id].year}) ${imdbCache[id].id}` : '—'}`);
  await new Promise(r => setTimeout(r, 250));
}
await writeFile(cachePath, JSON.stringify(imdbCache, null, 1));

const wantedIds = new Set(usedMovieIds.map(id => imdbCache[id]?.id).filter(Boolean));
const ratings = wantedIds.size ? await loadRatings(wantedIds) : {};
console.error(`ratings for ${Object.keys(ratings).length}/${wantedIds.size} films`);

const movies = {};
for (const id of usedMovieIds) {
  const m = movieById[id], c = imdbCache[id];
  movies[id] = {
    id, title: m.title.trim(), originalTitle: cleanTitle(m.originalTitle) || null,
    year: m.yearOfProduction || null, duration: m.duration, genres: m.genres.map(g => g.name),
    age: m.ratings?.[0]?.description ?? null, country: m.country, director: m.director,
    poster: m.posters?.[0] ?? c?.poster ?? null, forChildren: !!m.isForChildren,
    imdb: c ? { id: c.id, title: c.title, year: c.year, rating: ratings[c.id]?.rating ?? null, votes: ratings[c.id]?.votes ?? 0 } : null,
  };
}

// ---------- 3. screens (seat layouts) ----------
const cinemaIdsUsed = [...new Set(screeningsRaw.map(s => s.cinemaId))];
const screens = {};
await pool(cinemaIdsUsed, async cid => {
  const list = await get(`${API}/cinema/${cid}/screen`).catch(() => []);
  for (const sc of list) {
    const seats = sc.seats.filter(s => s.kind === '0' && !s.wheelchairSeat);
    const rows = sc.rows.length;
    // Sweet spot: rear-middle rows, central 40 % of each row's real seats.
    const byRow = {};
    for (const s of seats) (byRow[s.coordinateY] ??= []).push(s);
    const zone = new Set();
    for (const [y, rs] of Object.entries(byRow)) {
      const yy = rows > 1 ? y / (rows - 1) : 0.5;
      if (yy < 0.45 || yy > 0.8) continue;
      rs.sort((a, b) => a.coordinateX - b.coordinateX);
      const n = rs.length, from = Math.floor(n * 0.3), to = Math.ceil(n * 0.7);
      rs.slice(from, to).forEach(s => zone.add(s.id));
    }
    screens[sc.id] = { id: sc.id, cinemaId: cid, name: sc.name.trim(), feature: sc.feature || null, total: seats.length, zone: [...zone] };
  }
});
console.error(`${Object.keys(screens).length} screens`);

// ---------- 4. occupancy — today's upcoming screenings only; the page refreshes any day live ----------
const upcoming = screeningsRaw.filter(s => s.screeningTimeFrom.startsWith(days[0]) && new Date(s.screeningTimeFrom) > now && screens[s.screenId]);
console.error(`occupancy for ${upcoming.length} screenings today…`);
const occupancy = {};
let done = 0;
await pool(upcoming, async s => {
  const d = await get(`${API}/cinema/${s.cinemaId}/screening/${s.id}/occupancy`).catch(() => null);
  if (d) occupancy[s.id] = new Set(d.occupiedSeats ?? []);
  if (++done % 100 === 0) console.error(`  ${done}/${upcoming.length}`);
});

const seatStats = (screen, taken) => ({
  free: screen.total - taken.size, total: screen.total,
  good: screen.zone.filter(id => !taken.has(id)).length, goodTotal: screen.zone.length,
});

const screenings = screeningsRaw.filter(s => movies[s.movieId]).map(s => {
  const sc = screens[s.screenId], taken = occupancy[s.id];
  return {
    id: s.id, cinemaId: s.cinemaId, movieId: s.movieId, screenId: s.screenId,
    day: s.screeningTimeFrom.slice(0, 10), start: s.screeningTimeFrom, end: s.screeningTimeTo,
    print: s.printType, speaking: s.speakingType, release: s.release,
    screenName: sc?.name ?? null, screenFeature: sc?.feature ?? null,
    seats: sc && taken ? seatStats(sc, taken) : null,
    ticketUrl: `https://bilety.helios.pl/screen/${s.id}?cinemaId=${s.cinemaId}`,
  };
});

await writeFile(new URL('./data.json', import.meta.url), JSON.stringify({
  generatedAt: now.toISOString(), days, cinemas, movies, screenings,
  // just enough of each seat map for the page to recompute free/good seats from a live occupancy call
  screens: Object.fromEntries(Object.values(screens).map(s => [s.id, { total: s.total, zone: s.zone }])),
}));
console.error(`data.json: ${screenings.length} screenings, ${Object.keys(movies).length} films, ${Object.keys(occupancy).length} with live seats`);
