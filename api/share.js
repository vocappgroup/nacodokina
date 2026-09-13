// GET /k/<slug>/<film>  (rewritten to /api/share?k=&f=) → tiny page whose Open Graph tags describe
// that one film at that cinema today, then redirects to the app with the film highlighted.
import { picks } from './og.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://nacodokina.pl');
  const k = url.searchParams.get('k') ?? '', f = url.searchParams.get('f') ?? '';
  const data = await picks();
  const entry = data.cinemas[k];
  const film = entry?.films?.[f];
  const target = `/?kino=${encodeURIComponent(k)}${f ? `&film=${encodeURIComponent(f)}` : ''}`;
  if (!entry || !film) { res.status(302).setHeader('location', entry ? `/k/${k}` : '/').send(''); return; }
  const cinemaName = entry.cinema.toUpperCase() === entry.city.toUpperCase() ? `Helios ${entry.city}` : `${entry.cinema}, ${entry.city}`;
  const seats = film.good != null && film.good >= 1 ? `, ${film.good} ${plural(film.good, 'dobre miejsce wolne', 'dobre miejsca wolne', 'dobrych miejsc wolnych')}` : '';
  const title = `${film.title}${film.rating != null ? ` ${film.rating.toFixed(1)}` : ''} · dziś ${film.time} · ${cinemaName}`;
  const desc = `${film.rating != null ? `${film.rating.toFixed(1)} na IMDb, ` : ''}seanse: ${film.times.join(', ')}${seats}. Bilety na bilety.helios.pl.`;
  const v = data.generatedAt.slice(0, 16).replace(/\D/g, '');
  const img = `https://nacodokina.pl/api/og?k=${k}&f=${encodeURIComponent(f)}&v=${v}`;
  res.status(200).setHeader('content-type', 'text/html; charset=utf-8').setHeader('cache-control', 'public, max-age=300, s-maxage=900').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="https://nacodokina.pl/k/${k}/${f}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<script>location.replace("${target}")</script>
</head><body style="font-family:system-ui;padding:24px;background:#101318;color:#E8EAF0"><p>${esc(title)}</p><p><a href="${target}" style="color:#E3B341">Zobacz seanse →</a></p></body></html>
`);
}
