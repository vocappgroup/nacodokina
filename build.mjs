// Turns data.json into public/index.html — one self-contained page, data embedded.
//   node build.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';

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

const html = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Na co do kina — repertuar Helios wg ocen IMDb i wolnych dobrych miejsc</title>
<meta name="description" content="Wszystkie kina Helios w Polsce: filmy grane dziś, jutro i pojutrze posortowane wg oceny IMDb, przy każdej godzinie liczba wolnych dobrych miejsc.">
<meta property="og:title" content="Na co do kina">
<meta property="og:description" content="Repertuar Helios posortowany po ocenach IMDb + wolne dobre miejsca przy każdej godzinie.">
<meta property="og:image" content="https://nacodokina.pl/og.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://nacodokina.pl/">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍿</text></svg>">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
:root{
  --bg:#EEF0F4; --surface:#FFFFFF; --surface-2:#E4E7EE; --line:#CFD4DE;
  --ink:#14161C; --ink-2:#4C5261; --ink-3:#7B8194;
  --gold:#C9971B; --gold-ink:#5A4106; --gold-bg:#FBF1D2;
  --mid:#3F6B96; --mid-bg:#E0EAF5; --lo:#8A5A3C; --lo-bg:#F3E6DD;
  --chip:#1E6F78; --chip-bg:#DDEFF0; --chip-sub:#6B4A9E; --chip-sub-bg:#EBE3F6;
  --ok:#2E7D4F; --warn:#B8860B; --bad:#B23A3A;
  --shadow:0 1px 2px rgba(20,22,28,.06),0 8px 24px -12px rgba(20,22,28,.18);
  color-scheme:light dark;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#101318; --surface:#181C24; --surface-2:#20252F; --line:#2E3440;
    --ink:#E8EAF0; --ink-2:#AEB4C4; --ink-3:#7B8194;
    --gold:#E3B341; --gold-ink:#F4D27A; --gold-bg:#2E2610;
    --mid:#8FB4DA; --mid-bg:#1B2838; --lo:#D3A283; --lo-bg:#2C211A;
    --chip:#7FD0D8; --chip-bg:#15343A; --chip-sub:#C6AEE8; --chip-sub-bg:#2A2140;
    --ok:#5CCB8A; --warn:#E3B341; --bad:#E27272;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -12px rgba(0,0,0,.6);
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}
a:focus-visible,button:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.wrap{max-width:900px;margin:0 auto;padding:28px 16px 72px}
header{border-bottom:2px solid var(--ink);padding-bottom:16px;margin-bottom:16px}
.eyebrow{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
h1{font:600 clamp(34px,7vw,54px)/1 Oswald,"Arial Narrow",Impact,sans-serif;letter-spacing:.01em;text-transform:uppercase;margin:0;text-wrap:balance}
h1 small{display:block;font:500 clamp(15px,2.4vw,20px)/1.2 Oswald,sans-serif;color:var(--ink-2);letter-spacing:.08em;margin-top:8px;text-transform:none}
.days{display:flex;gap:6px;margin:18px 0 0;padding:0;list-style:none}
.days button{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:84px;padding:8px 12px;border-radius:6px}
.days button b{font:600 16px/1 Oswald,sans-serif;letter-spacing:.04em;text-transform:uppercase}
.days button small{font:500 11px/1 "IBM Plex Mono",monospace;color:var(--ink-3)}
.days button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)} .days button[aria-pressed="true"] small{color:var(--bg);opacity:.75}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:14px 0 0}
.controls label{display:flex;flex-direction:column;gap:4px;font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
select,button{font:500 15px/1.2 "IBM Plex Sans",sans-serif;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:9px 10px;min-height:40px}
select{min-width:220px;max-width:100%}
button{cursor:pointer}
button:hover{border-color:var(--ink-3)}
button.near{background:var(--gold-bg);color:var(--gold-ink);border-color:transparent;font-weight:600}
.status{font-size:13px;color:var(--ink-3);margin:10px 0 0;min-height:1.4em}
.summary{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:13px;color:var(--ink-2);margin:0 0 14px}
.summary b{color:var(--ink);font-weight:600}
.films{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.film{display:grid;grid-template-columns:34px 76px 1fr auto;gap:0 16px;align-items:stretch;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:12px 14px 12px 10px;box-shadow:var(--shadow)}
.rank{font:600 22px/1 Oswald,sans-serif;color:var(--ink-3);padding-top:6px;text-align:right;font-variant-numeric:tabular-nums}
.poster{width:76px;aspect-ratio:2/3;background:var(--surface-2);border-radius:3px;overflow:hidden;align-self:start}
.poster img{width:100%;height:100%;object-fit:cover;display:block}
.body{min-width:0;display:flex;flex-direction:column;gap:4px}
h2{font:600 22px/1.1 Oswald,"Arial Narrow",sans-serif;letter-spacing:.01em;margin:2px 0 0;text-wrap:balance}
.orig{margin:0;color:var(--ink-2);font-style:italic}
.meta{margin:0;color:var(--ink-3);font-size:13px;display:flex;flex-wrap:wrap;gap:2px 0}
.meta span+span::before{content:"·";margin:0 7px;color:var(--line)}
.meta .age{font:500 11px/1.2 "IBM Plex Mono",monospace;border:1px solid var(--line);border-radius:3px;padding:1px 5px;color:var(--ink-2);margin-left:8px}
.meta .age::before{content:none}
.chips{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:7px;background:var(--chip-bg);color:var(--chip);border-radius:4px;padding:7px 10px;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;text-decoration:none;min-height:36px}
.chip:hover{filter:brightness(.96)}
.chip b{font:600 16px/1 Oswald,sans-serif;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:var(--ink)}
.chip-sub{background:var(--chip-sub-bg);color:var(--chip-sub)}
.seat{display:inline-flex;align-items:center;gap:4px;padding-left:7px;border-left:1px solid rgba(127,127,127,.35);color:var(--ink-2)}
.seat::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ink-3)}
.seat.ok::before{background:var(--ok)} .seat.warn::before{background:var(--warn)} .seat.bad::before{background:var(--bad)}
.rating{align-self:center;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:88px;padding:10px 10px 8px;border-radius:6px;background:var(--gold-bg);color:var(--gold-ink);text-align:center}
.rating .lbl{font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.16em}
.rating .num{font:600 34px/1 Oswald,sans-serif;font-variant-numeric:tabular-nums;margin:4px 0 3px}
.rating .vt{font-size:11px;color:var(--ink-2);white-space:nowrap}
.rating.mid{background:var(--mid-bg);color:var(--mid)} .rating.lo{background:var(--lo-bg);color:var(--lo)}
.rating.none{background:var(--surface-2);color:var(--ink-3)} .rating.none .num{font-size:22px}
.film-dim{opacity:.7;box-shadow:none;background:transparent}
h3{font:600 14px/1 Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:36px 0 12px;display:flex;align-items:center;gap:12px}
h3::after{content:"";flex:1;height:1px;background:var(--line)}
.empty{padding:32px;text-align:center;color:var(--ink-3);border:1px dashed var(--line);border-radius:6px}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--ink-3);font-size:12.5px;display:grid;gap:8px}
footer dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 12px}
footer dt{font:500 11px/1.6 "IBM Plex Mono",monospace;color:var(--ink-2)} footer dd{margin:0}
footer p{margin:0}
@media (max-width:600px){
  .film{grid-template-columns:20px 56px 1fr;gap:0 10px;padding:10px}
  .poster{width:56px} .rank{font-size:16px}
  .rating{grid-column:1/-1;flex-direction:row;gap:10px;margin-top:10px;padding:8px 12px;justify-content:flex-start}
  .rating .num{font-size:24px;margin:0}
  select{min-width:0;width:100%} .controls label{width:100%} .controls label.half{width:calc(50% - 5px)}
  .days button{flex:1;min-width:0}
}
@media (prefers-reduced-motion:no-preference){ .film{transition:transform .15s ease} .film:hover{transform:translateY(-1px)} }
</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="eyebrow">Helios · cała Polska · strona nieoficjalna</p>
  <h1>Na co do kina<small id="daylabel">${dayLabel}</small></h1>
  <ul class="days" id="days">${dayTabs.map((d, i) => `<li><button type="button" data-day="${d.key}" aria-pressed="${i === 0}"><b>${d.label}</b><small>${d.sub}</small></button></li>`).join('')}</ul>
  <div class="controls">
    <label>Kino <select id="cinema"></select></label>
    <label>&nbsp;<button id="near" type="button" class="near">📍 Najbliższe kino</button></label>
    <label class="half">Od godziny <select id="from">
      <option value="now">teraz</option><option value="10:00">10:00</option><option value="12:00">12:00</option><option value="14:00">14:00</option><option value="16:00">16:00</option><option value="17:00">17:00</option><option value="18:00">18:00</option><option value="19:00">19:00</option><option value="20:00">20:00</option><option value="21:00">21:00</option>
    </select></label>
    <label class="half">Wersja <select id="lang">
      <option value="all">wszystkie</option><option value="orig">oryginał / napisy</option><option value="dub">dubbing</option>
    </select></label>
    <label>&nbsp;<button id="refresh" type="button">↻ Odśwież miejsca</button></label>
  </div>
  <p class="status" id="status"></p>
</header>

<div class="summary" id="summary"></div>
<ol class="films" id="list"></ol>
<div id="unrated"></div>

<footer>
  <dl>
    <dt>ocena</dt><dd>IMDb; kolejność wg oceny ważonej liczbą głosów (jak w Top 250), żeby film z 8.8 i 200 głosami nie wyprzedzał 8.4 z pół miliona; poniżej 100 głosów ocena ląduje w sekcji „bez wiarygodnej oceny"</dd>
    <dt>miejsca</dt><dd>wolne fotele w „dobrej strefie": tylne-środkowe rzędy, środkowe 40 % rzędu. ● zielony ≥ 6, żółty 1–5, czerwony brak. Migawka z ${timeLabel} dla dzisiejszych seansów; „Odśwież miejsca" pobiera aktualny stan dla wybranego dnia</dd>
    <dt>wersja</dt><dd>NAP = polskie napisy, ORG = oryginał bez napisów, DUB = polski dubbing, DUB UA = ukraiński dubbing (fioletowe chipy to dubbing)</dd>
  </dl>
  <p>Strona nieoficjalna, niezwiązana z Helios S.A. Repertuar, plany sal i zajętość miejsc: Helios. Oceny: IMDb (datasets.imdbws.com). Bilety kupujesz na bilety.helios.pl. Bez cookies i kont — wybrane kino pamięta tylko Twoja przeglądarka. Kontakt: kontakt@nacodokina.pl</p>
</footer>
</div>
<script>
const RAW = ${JSON.stringify(data).replace(/</g, '\\u003c')};
const DATA = { ...RAW, screenings: RAW.screenings.map(t => ({
  id: t[0], cinemaId: t[1], movieId: t[2], screenId: t[3], day: t[4].slice(0, 10), start: t[4] + ':00+02:00',
  speaking: { D: 'DUB', O: 'ORG', N: 'Napisy' }[t[5]], screenFeature: t[6] || null, print: t[7] === 'I' ? '2D IMAX' : '2D',
  seats: t[8] ? { free: t[8][0], total: t[8][1], good: t[8][2], goodTotal: t[8][3] } : null,
  ticketUrl: \`https://bilety.helios.pl/screen/\${t[0]}?cinemaId=\${t[1]}\`,
})) };
const $ = s => document.querySelector(s);
const M = 2500, C = 6.5; // Bayesian prior: 2 500 votes pulling toward 6.5
const MIN_VOTES = 100;    // below this an IMDb score is noise, not a rating
const weighted = i => (i.votes / (i.votes + M)) * i.rating + (M / (i.votes + M)) * C;
const hasRating = m => m.imdb?.rating != null && m.imdb.votes >= MIN_VOTES;
const isUaPrint = m => /\\s-\\s*UA$/i.test(m.title);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtVotes = n => n.toLocaleString('pl-PL').replace(/\\u00a0/g, ' ');
const hhmm = iso => iso.slice(11, 16);
let day = DATA.days[0];

// cinema select, grouped by city
const cinemas = Object.values(DATA.cinemas).filter(c => DATA.screenings.some(s => s.cinemaId === c.id));
const byCity = {};
for (const c of cinemas) (byCity[c.city] ??= []).push(c);
const sel = $('#cinema');
for (const city of Object.keys(byCity).sort((a, b) => a.localeCompare(b, 'pl'))) {
  const g = document.createElement('optgroup'); g.label = city;
  for (const c of byCity[city].sort((a, b) => a.name.localeCompare(b.name, 'pl'))) {
    const o = document.createElement('option'); o.value = c.id;
    o.textContent = byCity[city].length > 1 ? \`\${city} – \${c.name}\` : \`\${city}\${c.name.toUpperCase() === city.toUpperCase() ? '' : ' – ' + c.name}\`;
    g.appendChild(o);
  }
  sel.appendChild(g);
}
let saved = null; try { saved = localStorage.getItem('nacodokina.cinema'); } catch {}
sel.value = saved && DATA.cinemas[saved] ? saved : (cinemas.find(c => c.city === 'Warszawa') ?? cinemas[0]).id;

const seatClass = s => !s ? '' : s.good >= 6 ? 'ok' : s.good >= 1 ? 'warn' : 'bad';
const seatText = s => !s ? '' : s.good >= 1 ? \`\${s.good} dobr\${s.good === 1 ? 'e' : 'ych'}\` : s.free > 0 ? \`tylko boki (\${s.free})\` : 'wyprzedane';
const dayLabelFor = d => new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function render() {
  const cid = sel.value, from = $('#from').value, lang = $('#lang').value;
  try { localStorage.setItem('nacodokina.cinema', cid); } catch {}
  $('#daylabel').textContent = dayLabelFor(day);
  const cutoff = from === 'now' ? (day === DATA.days[0] ? Date.now() : 0) : new Date(\`\${day}T\${from}:00+02:00\`).getTime();
  const shows = DATA.screenings.filter(s => s.cinemaId === cid && s.day === day && new Date(s.start).getTime() >= cutoff
    && (lang === 'all' || (lang === 'dub' ? s.speaking === 'DUB' : s.speaking !== 'DUB')));
  // one card per film: Ukrainian-dubbed prints ("… - UA") fold into the Polish entry of the same IMDb title
  const groups = {};
  for (const s of shows) {
    const m = DATA.movies[s.movieId];
    const key = m.imdb?.id ?? s.movieId;
    const g = (groups[key] ??= { m, shows: [] });
    if (isUaPrint(g.m) && !isUaPrint(m)) g.m = m;
    g.shows.push(s);
  }
  const films = Object.values(groups).map(g => ({ m: g.m, shows: g.shows.sort((a, b) => a.start.localeCompare(b.start)) }));
  const rated = films.filter(f => hasRating(f.m)).sort((a, b) => weighted(b.m.imdb) - weighted(a.m.imdb) || b.m.imdb.votes - a.m.imdb.votes);
  const unrated = films.filter(f => !hasRating(f.m)).sort((a, b) => a.m.title.localeCompare(b.m.title, 'pl'));
  const c = DATA.cinemas[cid];
  $('#summary').innerHTML = \`<span><b>\${esc(c.city)}</b> · Helios \${esc(c.name)}, \${esc(c.street)}</span><span><b>\${films.length}</b> film\${films.length === 1 ? '' : films.length < 5 ? 'y' : 'ów'}, <b>\${shows.length}</b> seans\${shows.length === 1 ? '' : shows.length < 5 ? 'e' : 'ów'}</span>\`;
  const row = (f, i, dim) => {
    const m = f.m, im = m.imdb;
    const rc = !hasRating(m) ? 'none' : im.rating >= 7.5 ? '' : im.rating >= 6.5 ? 'mid' : 'lo';
    const genres = m.genres.join(', ');
    const dur = m.duration ? \`\${Math.floor(m.duration / 60)} h \${String(m.duration % 60).padStart(2, '0')} min\` : '';
    const chips = f.shows.map(s => {
      const ver = s.speaking === 'DUB' ? (isUaPrint(DATA.movies[s.movieId]) ? 'DUB UA' : 'DUB') : s.speaking === 'ORG' ? 'ORG' : 'NAP';
      const tags = [ver, s.screenFeature, s.print === '2D IMAX' ? 'IMAX' : null].filter(Boolean).join(' · ');
      const seat = s.seats ? \`<span class="seat \${seatClass(s.seats)}" title="\${s.seats.free} wolnych z \${s.seats.total}, \${s.seats.good} w dobrej strefie">\${seatText(s.seats)}</span>\` : '';
      return \`<li><a class="chip \${ver.startsWith('DUB') ? 'chip-sub' : ''}" href="\${s.ticketUrl}" target="_blank" rel="noopener"><b>\${hhmm(s.start)}</b><span>\${tags}</span>\${seat}</a></li>\`;
    }).join('');
    return \`<li class="film\${dim ? ' film-dim' : ''}">
      <div class="rank">\${i}</div>
      <div class="poster">\${m.poster ? \`<img src="\${esc(m.poster)}" alt="" loading="lazy">\` : ''}</div>
      <div class="body">
        <h2>\${esc(m.title)}</h2>
        \${m.originalTitle && m.originalTitle !== m.title ? \`<p class="orig">\${esc(m.originalTitle)}</p>\` : ''}
        <p class="meta">\${m.year ? \`<span>\${esc(m.year)}</span>\` : ''}\${genres ? \`<span>\${esc(genres)}</span>\` : ''}\${dur ? \`<span>\${dur}</span>\` : ''}\${m.country ? \`<span>\${esc(m.country)}</span>\` : ''}\${m.age ? \`<span class="age">\${esc(m.age)}</span>\` : ''}</p>
        <ul class="chips">\${chips}</ul>
      </div>
      \${hasRating(m)
        ? \`<a class="rating \${rc}" href="https://www.imdb.com/title/\${im.id}/" target="_blank" rel="noopener" title="\${esc(im.title)} (\${im.year}) na IMDb"><span class="lbl">IMDb</span><span class="num">\${im.rating.toFixed(1)}</span><span class="vt">\${fmtVotes(im.votes)} głosów</span></a>\`
        : \`<div class="rating none"><span class="lbl">IMDb</span><span class="num">\${im && im.rating != null ? im.rating.toFixed(1) : '—'}</span><span class="vt">\${im && im.rating != null ? \`tylko \${im.votes} głos\${im.votes === 1 ? '' : im.votes < 5 ? 'y' : 'ów'}\` : 'brak oceny'}</span></div>\`}
    </li>\`;
  };
  $('#list').innerHTML = rated.length ? rated.map((f, i) => row(f, i + 1, false)).join('') : \`<li class="empty">Nic nie gra po wybranej godzinie w tym kinie.</li>\`;
  $('#unrated').innerHTML = unrated.length ? \`<h3>Bez wiarygodnej oceny</h3><ol class="films">\${unrated.map((f, i) => row(f, rated.length + i + 1, true)).join('')}</ol>\` : '';
}

$('#cinema').addEventListener('change', render);
$('#from').addEventListener('change', render);
$('#lang').addEventListener('change', render);
$('#days').addEventListener('click', e => {
  const b = e.target.closest('button[data-day]'); if (!b) return;
  day = b.dataset.day;
  for (const x of document.querySelectorAll('#days button')) x.setAttribute('aria-pressed', x === b);
  render();
});

// nearest cinema by straight-line distance
const dist = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
$('#near').addEventListener('click', () => {
  if (!navigator.geolocation) { $('#status').textContent = 'Przeglądarka nie udostępnia lokalizacji.'; return; }
  $('#status').textContent = 'Szukam najbliższego Heliosa…';
  navigator.geolocation.getCurrentPosition(p => {
    const best = cinemas.map(c => ({ c, km: dist(p.coords.latitude, p.coords.longitude, c.lat, c.lon) })).sort((a, b) => a.km - b.km)[0];
    sel.value = best.c.id; render();
    $('#status').textContent = \`Najbliżej: \${best.c.city} – \${best.c.name}, \${best.km.toFixed(best.km < 10 ? 1 : 0)} km w linii prostej.\`;
  }, () => { $('#status').textContent = 'Nie udało się pobrać lokalizacji — wybierz kino z listy.'; }, { timeout: 8000 });
});

// live occupancy straight from Helios (their API sends permissive CORS headers)
$('#refresh').addEventListener('click', async () => {
  const cid = sel.value;
  const shows = DATA.screenings.filter(s => s.cinemaId === cid && s.day === day && new Date(s.start).getTime() >= Date.now() && DATA.screens[s.screenId]);
  $('#status').textContent = \`Odświeżam zajętość \${shows.length} seansów…\`;
  let ok = 0;
  await Promise.all(shows.map(async s => {
    try {
      const r = await fetch(\`https://restapi.helios.pl/api/cinema/\${cid}/screening/\${s.id}/occupancy\`);
      const taken = new Set((await r.json()).occupiedSeats ?? []);
      const sc = DATA.screens[s.screenId];
      s.seats = { free: sc.total - taken.size, total: sc.total, good: sc.zone.filter(id => !taken.has(id)).length, goodTotal: sc.zone.length };
      ok++;
    } catch {}
  }));
  render();
  $('#status').textContent = ok ? \`Miejsca aktualne na \${new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} (\${ok}/\${shows.length} seansów).\` : 'Nie udało się połączyć z Heliosem — zostały dane z migawki.';
});

render();
</script>
</body>
</html>
`;
await mkdir(new URL('./public/', import.meta.url), { recursive: true });
await writeFile(new URL('./public/index.html', import.meta.url), html);
console.error(`public/index.html: ${(html.length / 1024).toFixed(0)} KB`);
