// Turns data.json into public/index.html — one self-contained page, data embedded. Markup lives in page.mjs.
//   node build.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { page } from './page.mjs';

const raw = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
// Compact the payload: ~3 800 screenings as short tuples instead of verbose objects (2.3 MB → ~0.6 MB before gzip).
const screenIds = Object.keys(raw.screens);
const screenIdx = Object.fromEntries(screenIds.map((id, i) => [id, i]));
const data = {
  generatedAt: raw.generatedAt, days: raw.days, cinemas: raw.cinemas, movies: raw.movies,
  screens: screenIds.map(id => raw.screens[id]),
  // [id, cinemaId, movieId, screenIdx, start, speaking, feature, print, seats|null]
  screenings: raw.screenings.map(s => [s.id, s.cinemaId, s.movieId, screenIdx[s.screenId] ?? -1, s.start.slice(0, 16),
    s.speaking === 'DUB' ? 'D' : s.speaking === 'ORG' ? 'O' : 'N', s.screenFeature ?? '', s.print === '2D IMAX' ? 'I' : '',
    s.seats ? [s.seats.free, s.seats.total, s.seats.good, s.seats.goodTotal] : null]),
};
const generated = new Date(data.generatedAt);
const fmtDay = (d, opts) => new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', ...opts });
const dayLabel = fmtDay(data.days[0], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeLabel = generated.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
const dayTabs = data.days.map((d, i) => ({ key: d, label: i === 0 ? 'dziś' : i === 1 ? 'jutro' : fmtDay(d, { weekday: 'short' }), sub: fmtDay(d, { day: 'numeric', month: 'short' }) }));

const html = page({ data, dayLabel, timeLabel, dayTabs });
await mkdir(new URL('./public/', import.meta.url), { recursive: true });
await writeFile(new URL('./public/index.html', import.meta.url), html);
console.error(`public/index.html: ${(html.length / 1024).toFixed(0)} KB`);
