// Turns data.json into public/: index.html (the app, data embedded), picks.json (pick of the day per
// cinema, read by api/og.js) and k/<slug>.html (share pages with their own Open Graph tags).
//   node build.mjs
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { page } from './page.mjs';

const raw = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
const M = 2500, C = 6.5, MIN_VOTES = 100;
const weighted = i => (i.votes / (i.votes + M)) * i.rating + (M / (i.votes + M)) * C;
const hasRating = m => m.imdb?.rating != null && m.imdb.votes >= MIN_VOTES;
const isUaPrint = m => /\s-\s*UA$/i.test(m.title);
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
const slugify = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- slugs: city alone when it has one Helios, city-cinema otherwise ----------
const byCity = {};
for (const c of Object.values(raw.cinemas)) (byCity[c.city] ??= []).push(c);
for (const c of Object.values(raw.cinemas)) c.slug = byCity[c.city].length === 1 ? slugify(c.city) : slugify(`${c.city} ${c.name}`);

// ---------- pick of the day per cinema (same rules as the page, evaluated at build time) ----------
const now = Date.now();
const today = raw.days[0];
const fmtDay = (d, opts) => new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', ...opts });
const pickFor = cinema => {
  const shows = raw.screenings.filter(s => s.cinemaId === cinema.id && s.day === today && new Date(s.start).getTime() > now);
  const groups = {};
  for (const s of shows) {
    const m = raw.movies[s.movieId];
    const g = (groups[m.imdb?.id ?? s.movieId] ??= { m, shows: [] });
    if (isUaPrint(g.m) && !isUaPrint(m)) g.m = m;
    g.shows.push(s);
  }
  const rated = Object.values(groups).filter(g => hasRating(g.m)).sort((a, b) => weighted(b.m.imdb) - weighted(a.m.imdb) || b.m.imdb.votes - a.m.imdb.votes);
  const f = rated.find(g => g.shows.some(s => !s.seats || s.seats.good >= 1));
  if (!f) return null;
  const shows2 = f.shows.sort((a, b) => a.start.localeCompare(b.start));
  const best = shows2.find(s => !s.seats || s.seats.good >= 6) ?? shows2.find(s => !s.seats || s.seats.good >= 1);
  const ver = best.speaking === 'DUB' ? (isUaPrint(raw.movies[best.movieId]) ? 'DUB UA' : 'DUB') : best.speaking === 'ORG' ? 'ORG' : 'NAP';
  return { title: f.m.title, orig: f.m.originalTitle, rating: f.m.imdb.rating, votes: f.m.imdb.votes, imdbId: f.m.imdb.id,
    time: best.start.slice(11, 16), end: best.end.slice(11, 16), ver, good: best.seats?.good ?? null, goodTotal: best.seats?.goodTotal ?? null, pairs: best.seats?.pairs ?? null, poster: f.m.poster, ticketUrl: best.ticketUrl };
};
const filmKey = m => m.imdb?.id ?? m.id;
const filmsFor = cinema => {
  const shows = raw.screenings.filter(s => s.cinemaId === cinema.id && s.day === today && new Date(s.start).getTime() > now);
  const groups = {};
  for (const s of shows) {
    const m = raw.movies[s.movieId];
    const g = (groups[filmKey(m)] ??= { m, shows: [] });
    if (isUaPrint(g.m) && !isUaPrint(m)) g.m = m;
    g.shows.push(s);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, g]) => {
    const shows2 = g.shows.sort((a, b) => a.start.localeCompare(b.start));
    const best = shows2.find(s => !s.seats || s.seats.good >= 6) ?? shows2.find(s => !s.seats || s.seats.good >= 1) ?? shows2[0];
    const ver = best.speaking === 'DUB' ? (isUaPrint(raw.movies[best.movieId]) ? 'DUB UA' : 'DUB') : best.speaking === 'ORG' ? 'ORG' : 'NAP';
    return [key, { title: g.m.title, orig: g.m.originalTitle, rating: hasRating(g.m) ? g.m.imdb.rating : null, votes: g.m.imdb?.votes ?? 0, imdbId: g.m.imdb?.id ?? null,
      time: best.start.slice(11, 16), end: best.end.slice(11, 16), ver, good: best.seats?.good ?? null, goodTotal: best.seats?.goodTotal ?? null, pairs: best.seats?.pairs ?? null,
      poster: g.m.poster, ticketUrl: best.ticketUrl, times: shows2.map(s => s.start.slice(11, 16)) }];
  }));
};
const picks = {
  generatedAt: raw.generatedAt, day: today, dayLabel: 'dziś',
  cinemas: Object.fromEntries(Object.values(raw.cinemas).map(c => [c.slug, { slug: c.slug, cinemaId: c.id, city: c.city, cinema: c.name, pick: pickFor(c), films: filmsFor(c) }])),
};

// ---------- compact payload for the page ----------
const screenIds = Object.keys(raw.screens);
const screenIdx = Object.fromEntries(screenIds.map((id, i) => [id, i]));
const data = {
  generatedAt: raw.generatedAt, days: raw.days, cinemas: raw.cinemas, movies: raw.movies,
  screens: screenIds.map(id => raw.screens[id]),
  // [id, cinemaId, movieId, screenIdx, start, speaking, feature, print, seats|null, end]
  screenings: raw.screenings.map(s => [s.id, s.cinemaId, s.movieId, screenIdx[s.screenId] ?? -1, s.start.slice(0, 16),
    s.speaking === 'DUB' ? 'D' : s.speaking === 'ORG' ? 'O' : 'N', s.screenFeature ?? '', s.print === '2D IMAX' ? 'I' : '',
    s.seats ? [s.seats.free, s.seats.total, s.seats.good, s.seats.goodTotal, s.seats.pairs ?? 0, s.seats.pairsTotal ?? 0] : null, s.end.slice(0, 16)]),
};
const generated = new Date(data.generatedAt);
const dayLabel = fmtDay(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeLabel = generated.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
const dayTabs = data.days.map((d, i) => ({ key: d, label: i === 0 ? 'dziś' : i === 1 ? 'jutro' : fmtDay(d, { weekday: 'short' }), sub: fmtDay(d, { day: 'numeric', month: 'short' }) }));

// ---------- write ----------
const out = new URL('./public/', import.meta.url);
await mkdir(new URL('./k/', out), { recursive: true });
await rm(new URL('./k/', out), { recursive: true, force: true });
await mkdir(new URL('./k/', out), { recursive: true });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const v = generated.toISOString().slice(0, 16).replace(/\D/g, '');
for (const e of Object.values(picks.cinemas)) {
  const p = e.pick;
  const cinemaName = e.cinema.toUpperCase() === e.city.toUpperCase() ? `Helios ${e.city}` : `${e.cinema}, ${e.city}`;
  const seats = p?.good != null && p.good >= 1 ? `, ${p.good} ${plural(p.good, 'dobre miejsce wolne', 'dobre miejsca wolne', 'dobrych miejsc wolnych')}` : '';
  const title = p ? `Dziś · ${cinemaName}: ${p.title} ${p.rating.toFixed(1)}, ${p.time}` : `Na co do kina · ${cinemaName}`;
  const desc = p ? `${p.title} — ${p.rating.toFixed(1)} na IMDb, seans o ${p.time}${seats}. Cały repertuar ${cinemaName} posortowany po ocenach.` : `Repertuar kina ${cinemaName} posortowany po ocenach IMDb, z wolnymi dobrymi miejscami przy każdej godzinie.`;
  const url = `https://nacodokina.pl/k/${e.slug}`;
  await writeFile(new URL(`./k/${e.slug}.html`, out), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://nacodokina.pl/api/og?k=${e.slug}&v=${v}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="https://nacodokina.pl/api/og?k=${e.slug}&v=${v}">
<script>location.replace("/?kino=${e.slug}")</script><link rel="canonical" href="${url}">
</head><body style="font-family:system-ui;padding:24px;background:#101318;color:#E8EAF0"><p>${esc(title)}</p><p><a href="/?kino=${e.slug}" style="color:#E3B341">Zobacz cały repertuar →</a></p></body></html>
`);
}
await writeFile(new URL('./picks.json', out), JSON.stringify(picks));
const cityCount = new Set(Object.values(raw.cinemas).map(c => c.city)).size, n = Object.keys(raw.cinemas).length, cinemaCount = `${n} ${plural(n, 'kino', 'kina', 'kin')}`;
const html = page({ data, dayLabel, timeLabel, dayTabs, cityCount, cinemaCount });
await writeFile(new URL('./index.html', out), html);
console.error(`public/index.html: ${(html.length / 1024).toFixed(0)} KB · picks.json: ${Object.values(picks.cinemas).filter(e => e.pick).length}/${Object.keys(picks.cinemas).length} cinemas with a pick · k/: ${Object.keys(picks.cinemas).length} share pages`);
