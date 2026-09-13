// The page template. build.mjs feeds it the compacted data and writes public/index.html.
export const page = ({ data, dayLabel, timeLabel, dayTabs }) => `<!doctype html>
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
  --ok:#2E7D4F; --ok-bg:#DDF0E4; --warn:#9A6B00; --warn-bg:#FBEBC2; --bad:#B23A3A; --bad-bg:#F6DEDE;
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
    --ok:#5CCB8A; --ok-bg:#15301F; --warn:#E3B341; --warn-bg:#33290F; --bad:#E27272; --bad-bg:#3A1C1C;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -12px rgba(0,0,0,.6);
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}
a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.wrap{max-width:900px;margin:0 auto;padding:24px 16px 72px}
[hidden]{display:none!important}

/* header */
header{display:flex;flex-direction:column;gap:14px;border-bottom:2px solid var(--ink);padding-bottom:16px;margin-bottom:18px}
.eyebrow{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:0}
.titlerow{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:10px 20px}
h1{font:600 clamp(34px,7vw,54px)/1 Oswald,"Arial Narrow",Impact,sans-serif;letter-spacing:.01em;text-transform:uppercase;margin:0;text-wrap:balance}
h1 small{display:block;font:500 clamp(15px,2.4vw,20px)/1.2 Oswald,sans-serif;color:var(--ink-2);letter-spacing:.08em;margin-top:8px;text-transform:none}
.cinemabtn{display:inline-flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:10px 14px;text-align:left;max-width:100%}
.cinemabtn .c{font:600 18px/1.1 Oswald,sans-serif;letter-spacing:.02em}
.cinemabtn .n{font-size:12.5px;color:var(--ink-3);display:block;margin-top:2px}
.cinemabtn .arr{color:var(--ink-3);font-size:12px;margin-left:4px}
.days{display:flex;gap:6px;margin:0;padding:0;list-style:none}
.days button{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:84px;padding:8px 12px;border-radius:6px}
.days button b{font:600 16px/1 Oswald,sans-serif;letter-spacing:.04em;text-transform:uppercase}
.days button small{font:500 11px/1 "IBM Plex Mono",monospace;color:var(--ink-3)}
.days button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)} .days button[aria-pressed="true"] small{color:var(--bg);opacity:.75}
select,button,input{font:500 15px/1.2 "IBM Plex Sans",sans-serif;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:9px 10px;min-height:40px}
button{cursor:pointer} button:hover{border-color:var(--ink-3)}
button.primary{background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600}
button.gold{background:var(--gold-bg);color:var(--gold-ink);border-color:transparent;font-weight:600}

/* first visit */
.welcome{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:28px 22px;box-shadow:var(--shadow);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.welcome h2{font:600 30px/1.1 Oswald,sans-serif;margin:0;letter-spacing:.01em}
.welcome p{margin:0;color:var(--ink-2);max-width:44ch}
.welcome .btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.welcome button{min-height:48px;padding:0 18px;font-size:16px}

/* hero: the answer */
.hero{background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--gold);border-radius:8px;padding:16px 18px 16px 16px;box-shadow:var(--shadow);display:grid;grid-template-columns:110px 1fr;gap:16px;margin:0 0 20px}
.hero .poster{width:110px}
.hero .lbl{font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-ink);margin:0 0 6px}
.hero h2{font:600 30px/1.05 Oswald,sans-serif;letter-spacing:.01em;margin:0;text-wrap:balance}
.hero .orig{margin:2px 0 0}
.hero .why{margin:8px 0 0;color:var(--ink-2)}
.hero .why b{color:var(--ink);font-weight:600}
.hero .cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px}
.hero .buy{display:inline-flex;align-items:center;gap:10px;white-space:nowrap;background:var(--ink);color:var(--bg);border-radius:6px;padding:10px 16px;text-decoration:none;font-weight:600;min-height:44px}
.hero .buy b{font:600 20px/1 Oswald,sans-serif;letter-spacing:.02em}
.hero .more{color:var(--ink-3);font-size:13px}
.hero .share{min-height:44px;padding:0 14px}
.hero .top{display:flex;justify-content:space-between;gap:12px;align-items:start}

/* filters */
.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 6px}
.controls select{min-width:150px}
.controls #duo[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.status{font-size:13px;color:var(--ink-3);margin:0 0 12px;min-height:1.2em}
.legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font-size:12.5px;color:var(--ink-3);margin:0 0 12px}
.legend i{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--ok);margin-right:5px;vertical-align:-1px}
.legend i.w{background:var(--warn)} .legend i.b{background:var(--bad)}
.sectionhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 10px}
.sectionhead h3{margin:0}
.sectionhead span{font-size:13px;color:var(--ink-3)}

/* list */
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
.chips{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.chip{display:flex;flex-direction:column;gap:6px;background:var(--chip-bg);color:var(--chip);border-radius:6px;padding:8px 10px;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;text-decoration:none;min-width:150px}
.chip:hover{filter:brightness(.96)}
.chip .t{display:flex;align-items:baseline;gap:8px}
.chip .t b{font:600 18px/1 Oswald,sans-serif;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:var(--ink)}
.chip .t em{font-style:normal;color:var(--ink-3);margin-left:auto}
.chip-sub{background:var(--chip-sub-bg);color:var(--chip-sub)}
.seat{display:flex;align-items:center;gap:7px;font:500 12px/1.2 "IBM Plex Sans",sans-serif;color:var(--ink-2)}
.seat i{flex:0 0 42px;height:6px;border-radius:3px;background:rgba(127,127,127,.25);position:relative;overflow:hidden}
.seat i::after{content:"";position:absolute;inset:0;width:var(--p,0%);background:var(--ink-3);border-radius:3px}
.seat.ok{color:var(--ok)} .seat.ok i::after{background:var(--ok)}
.seat.warn{color:var(--warn)} .seat.warn i::after{background:var(--warn)}
.seat.bad{color:var(--bad)} .seat.bad i::after{background:var(--bad)}
.seat.na{color:var(--ink-3)}
.rating{align-self:center;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:88px;padding:10px 10px 8px;border-radius:6px;background:var(--gold-bg);color:var(--gold-ink);text-align:center}
.rating .lbl{font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.16em}
.rating .num{font:600 34px/1 Oswald,sans-serif;font-variant-numeric:tabular-nums;margin:4px 0 3px}
.rating .vt{font-size:11px;color:var(--ink-2);white-space:nowrap}
.rating.mid{background:var(--mid-bg);color:var(--mid)} .rating.lo{background:var(--lo-bg);color:var(--lo)}
.rating.none{background:var(--surface-2);color:var(--ink-3)} .rating.none .num{font-size:22px}
.film-dim{opacity:.7;box-shadow:none;background:transparent}
.film .side{display:flex;flex-direction:column;align-items:stretch;gap:6px;align-self:center}
.film .sharebtn{font-size:12.5px;padding:6px 8px;min-height:32px;color:var(--ink-2)}
.film.hl{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-bg),var(--shadow)}
h3{font:600 14px/1 Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:32px 0 12px;display:flex;align-items:center;gap:12px}
h3::after{content:"";flex:1;height:1px;background:var(--line)}
.empty{padding:32px;text-align:center;color:var(--ink-3);border:1px dashed var(--line);border-radius:6px}

/* cinema picker */
dialog{border:0;border-radius:12px 12px 0 0;padding:0;width:min(100%,560px);max-height:85vh;margin:auto auto 0;background:var(--surface);color:var(--ink);box-shadow:0 -8px 40px rgba(0,0,0,.35)}
dialog::backdrop{background:rgba(0,0,0,.45)}
@media (min-width:700px){ dialog{border-radius:12px;margin:auto} }
.pick-head{position:sticky;top:0;background:var(--surface);padding:14px 16px 10px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center;z-index:1}
.pick-head input{flex:1;min-height:44px;font-size:16px}
.pick-list{list-style:none;margin:0;padding:6px 0 14px;overflow:auto;max-height:calc(85vh - 70px)}
.pick-list li.city{position:sticky;top:0;background:var(--surface-2);font:600 12px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:8px 16px}
.pick-list button{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;border:0;border-radius:0;background:none;text-align:left;padding:12px 16px;min-height:48px;font-size:16px}
.pick-list button:hover,.pick-list button:focus-visible{background:var(--surface-2);outline:none}
.pick-list button .c{font-weight:600}
.pick-list button .n{color:var(--ink-3);font-size:13px}
.pick-list button.sub{padding-left:28px}
.pick-list button.sub .c{font-weight:500}
.pick-list button[aria-current="true"]{background:var(--gold-bg);color:var(--gold-ink)}
.pick-list button.near{color:var(--gold-ink);font-weight:600}

footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--ink-3);font-size:12.5px;display:grid;gap:8px}
footer dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 12px}
footer dt{font:500 11px/1.6 "IBM Plex Mono",monospace;color:var(--ink-2)} footer dd{margin:0}
footer p{margin:0}
@media (max-width:600px){
  .film{grid-template-columns:20px 56px 1fr;gap:0 10px;padding:10px}
  .poster{width:56px} .rank{font-size:16px}
  .film .side{grid-column:1/-1;flex-direction:row;margin-top:10px;align-items:center}
  .film .side .rating{flex:1}
  .rating{flex-direction:row;gap:10px;padding:8px 12px;justify-content:flex-start}
  .rating .num{font-size:24px;margin:0}
  .hero{grid-template-columns:84px 1fr;gap:12px;padding:14px}
  .hero .poster{width:84px} .hero h2{font-size:24px}
  .hero .rating{grid-column:auto;flex-direction:column;margin:0;padding:8px}
  .days button{flex:1;min-width:0}
  .controls select{flex:1 1 40%;min-width:0} .controls #refresh,.controls #duo{flex:1 1 45%}
  .hero .cta .buy{width:100%;justify-content:center} .hero .cta .share{width:100%}
  .hero .lbl{font-size:10px}
  .chip{flex:1 1 calc(50% - 4px);min-width:0}
}
@media (prefers-reduced-motion:no-preference){ .film{transition:transform .15s ease} .film:hover{transform:translateY(-1px)} }
</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="eyebrow">Helios · cała Polska · strona nieoficjalna</p>
  <div class="titlerow">
    <h1>Na co do kina<small id="daylabel">${dayLabel}</small></h1>
    <button type="button" class="cinemabtn" id="cinemabtn" hidden><span><span class="c" id="cb-city"></span><span class="n" id="cb-name"></span></span><span class="arr">▼</span></button>
  </div>
  <ul class="days" id="days" hidden>${dayTabs.map((d, i) => `<li><button type="button" data-day="${d.key}" aria-pressed="${i === 0}"><b>${d.label}</b><small>${d.sub}</small></button></li>`).join('')}</ul>
</header>

<section class="welcome" id="welcome" hidden>
  <h2>Gdzie idziesz do kina?</h2>
  <p>Pokażemy, na co warto — filmy w Twoim Heliosie posortowane po ocenach, z wolnymi dobrymi miejscami przy każdej godzinie.</p>
  <div class="btns"><button type="button" class="primary" id="near-welcome">📍 Znajdź najbliższy Helios</button><button type="button" id="pick-welcome">Wybierz z listy</button></div>
  <p class="status" id="status-welcome"></p>
</section>

<div id="main" hidden>
  <section class="hero" id="hero"></section>
  <div class="controls">
    <select id="from" aria-label="Wolny od godziny">
      <option value="now">wolny od teraz</option><option value="10:00">wolny od 10:00</option><option value="12:00">wolny od 12:00</option><option value="14:00">wolny od 14:00</option><option value="16:00">wolny od 16:00</option><option value="17:00">wolny od 17:00</option><option value="18:00">wolny od 18:00</option><option value="19:00">wolny od 19:00</option><option value="20:00">wolny od 20:00</option><option value="21:00">wolny od 21:00</option>
    </select>
    <select id="to" aria-label="Muszę wyjść przed">
      <option value="none">bez limitu</option><option value="20:00">wychodzę przed 20:00</option><option value="21:00">wychodzę przed 21:00</option><option value="22:00">wychodzę przed 22:00</option><option value="22:30">wychodzę przed 22:30</option><option value="23:00">wychodzę przed 23:00</option><option value="23:30">wychodzę przed 23:30</option><option value="00:00">wychodzę przed 00:00</option><option value="00:30">wychodzę przed 00:30</option><option value="01:00">wychodzę przed 01:00</option>
    </select>
    <button id="duo" type="button" aria-pressed="false" title="Pokazuj tylko pary sąsiednich dobrych miejsc">👥 We dwoje</button>
    <select id="lang" aria-label="Wersja językowa">
      <option value="all">każda wersja</option><option value="orig">oryginał / napisy</option><option value="dub">dubbing</option>
    </select>
    <button id="refresh" type="button">↻ Odśwież miejsca</button>
  </div>
  <p class="status" id="status"></p>
  <p class="legend"><span><i></i><span id="legend-what">dobre miejsca = środek sali, tylne rzędy</span></span><span><i class="w"></i>kończą się</span><span><i class="b"></i>zostały boki</span><span>liczone z planu sali i aktualnej zajętości</span></p>
  <div class="sectionhead"><h3>Wszystkie filmy</h3><span id="summary"></span></div>
  <ol class="films" id="list"></ol>
  <div id="unrated"></div>
</div>

<dialog id="picker">
  <div class="pick-head"><input type="search" id="pick-search" placeholder="Szukaj miasta…" autocomplete="off"><button type="button" id="pick-close" aria-label="Zamknij">✕</button></div>
  <ul class="pick-list" id="pick-list"></ul>
</dialog>

<footer>
  <dl>
    <dt>ocena</dt><dd>IMDb; kolejność wg oceny ważonej liczbą głosów (jak w Top 250), żeby film z 8.8 i 200 głosami nie wyprzedzał 8.4 z pół miliona; poniżej 100 głosów ocena ląduje w sekcji „bez wiarygodnej oceny"</dd>
    <dt>miejsca</dt><dd>wolne fotele w „dobrej strefie": tylne-środkowe rzędy, środkowe 40 % rzędu, liczone z planu sali i listy zajętych foteli. Pasek pokazuje, jaka część dobrej strefy jest jeszcze wolna. Migawka z ${timeLabel} dla dzisiejszych seansów; „Odśwież miejsca" pobiera aktualny stan dla wybranego dnia</dd>
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
  seats: t[8] ? { free: t[8][0], total: t[8][1], good: t[8][2], goodTotal: t[8][3], pairs: t[8][4] ?? 0, pairsTotal: t[8][5] ?? 0 } : null,
  end: (t[9] ?? t[4]) + ':00+02:00',
  ticketUrl: \`https://bilety.helios.pl/screen/\${t[0]}?cinemaId=\${t[1]}\`,
})) };
const $ = s => document.querySelector(s);
const M = 2500, C = 6.5; // Bayesian prior: 2 500 votes pulling toward 6.5
const MIN_VOTES = 100;    // below this an IMDb score is noise, not a rating
const weighted = i => (i.votes / (i.votes + M)) * i.rating + (M / (i.votes + M)) * C;
const hasRating = m => m.imdb?.rating != null && m.imdb.votes >= MIN_VOTES;
const isUaPrint = m => /\\s-\\s*UA$/i.test(m.title);
const filmKey = m => m.imdb?.id ?? m.id;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtVotes = n => n.toLocaleString('pl-PL').replace(/\\u00a0/g, ' ');
const hhmm = iso => iso.slice(11, 16);
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
const dayLabelFor = d => new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const untilText = start => {
  const min = Math.round((new Date(start).getTime() - Date.now()) / 60000);
  if (min < 0 || min > 180) return '';
  return min < 60 ? \`za \${min} min\` : \`za \${Math.floor(min / 60)} h \${String(min % 60).padStart(2, '0')}\`;
};

let day = DATA.days[0];
let cinemaId = null;
try { cinemaId = localStorage.getItem('nacodokina.cinema'); } catch {}
// a shared link (/k/<slug> → /?kino=<slug>) wins over the remembered cinema
const wanted = new URLSearchParams(location.search).get('kino');
let highlight = new URLSearchParams(location.search).get('film');
if (wanted) {
  const hit = Object.values(DATA.cinemas).find(c => c.slug === wanted);
  if (hit) { cinemaId = hit.id; try { localStorage.setItem('nacodokina.cinema', hit.id); } catch {} }
  history.replaceState(null, '', location.pathname);
}
if (cinemaId && !DATA.cinemas[cinemaId]) cinemaId = null;
try { const f = localStorage.getItem('nacodokina.from'); if (f) document.querySelector('#from').value = f; } catch {}
try { const l = localStorage.getItem('nacodokina.lang'); if (l) document.querySelector('#lang').value = l; } catch {}
try { const t = localStorage.getItem('nacodokina.to'); if (t) document.querySelector('#to').value = t; } catch {}
try { duo = localStorage.getItem('nacodokina.duo') === '1'; } catch {}

const cinemas = Object.values(DATA.cinemas).filter(c => DATA.screenings.some(s => s.cinemaId === c.id));
const byCity = {};
for (const c of cinemas) (byCity[c.city] ??= []).push(c);
const cities = Object.keys(byCity).sort((a, b) => a.localeCompare(b, 'pl'));
const cinemaLabel = c => c.name.toUpperCase() === c.city.toUpperCase() ? 'Helios' : \`Helios \${c.name}\`;

// ---------- seats ----------
let duo = false;
// "good" = free seats in the good zone; with "we dwoje" on, it's pairs of side-by-side seats there
const goodOf = s => duo ? s.pairs : s.good;
const goodTotalOf = s => duo ? s.pairsTotal : s.goodTotal;
const seatClass = s => !s ? 'na' : goodOf(s) >= (duo ? 4 : 6) ? 'ok' : goodOf(s) >= 1 ? 'warn' : 'bad';
const seatText = s => {
  if (!s) return '';
  const g = goodOf(s);
  if (duo) {
    if (g >= 4) return \`\${g} \${plural(g, 'para', 'pary', 'par')} obok siebie\`;
    if (g >= 1) return \`\${g === 1 ? 'została' : plural(g, '', 'zostały', 'zostało')} \${g} \${plural(g, 'para', 'pary', 'par')}\`;
    return s.free > 1 ? 'bez pary w dobrej strefie' : 'wyprzedane';
  }
  if (g >= 6) return \`\${g} \${plural(g, 'dobre miejsce', 'dobre miejsca', 'dobrych miejsc')}\`;
  if (g >= 1) return \`\${g === 1 ? 'zostało' : plural(g, '', 'zostały', 'zostało')} \${g} \${plural(g, 'dobre', 'dobre', 'dobrych')}\`;
  if (s.free > 0) return \`tylko boki (\${s.free} \${plural(s.free, 'wolne', 'wolne', 'wolnych')})\`;
  return 'wyprzedane';
};
const seatHtml = s => s ? \`<span class="seat \${seatClass(s)}" title="\${s.free} wolnych z \${s.total}; \${s.good} z \${s.goodTotal} w dobrej strefie, \${s.pairs} par obok siebie"><i style="--p:\${Math.round(100 * goodOf(s) / Math.max(1, goodTotalOf(s)))}%"></i>\${seatText(s)}</span>\` : '';

const verOf = s => s.speaking === 'DUB' ? (isUaPrint(DATA.movies[s.movieId]) ? 'DUB UA' : 'DUB') : s.speaking === 'ORG' ? 'ORG' : 'NAP';
const chipHtml = s => {
  const ver = verOf(s);
  const tags = [ver, s.screenFeature, s.print === '2D IMAX' ? 'IMAX' : null].filter(Boolean).join(' · ');
  const until = $('#to').value !== 'none' ? \`do \${hhmm(s.end)}\` : s.day === DATA.days[0] ? untilText(s.start) : '';
  return \`<li><a class="chip \${ver.startsWith('DUB') ? 'chip-sub' : ''}" href="\${s.ticketUrl}" target="_blank" rel="noopener" title="\${hhmm(s.start)}–\${hhmm(s.end)}"><span class="t"><b>\${hhmm(s.start)}</b><span>\${tags}</span>\${until ? \`<em>\${until}</em>\` : ''}</span>\${seatHtml(s.seats)}</a></li>\`;
};

// ---------- cinema picker ----------
const picker = $('#picker'), pickList = $('#pick-list'), pickSearch = $('#pick-search');
const renderPicker = (q = '') => {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '');
  const qq = norm(q.trim());
  const rows = [\`<li><button type="button" class="near" data-near="1">📍 Najbliższe kino<span class="n">z lokalizacji</span></button></li>\`];
  for (const city of cities) {
    const cs = byCity[city].filter(c => !qq || norm(city).includes(qq) || norm(c.name).includes(qq));
    if (!cs.length) continue;
    if (cs.length === 1 && byCity[city].length === 1) {
      const c = cs[0];
      rows.push(\`<li><button type="button" data-id="\${c.id}" aria-current="\${c.id === cinemaId}"><span class="c">\${esc(city)}</span><span class="n">\${esc(cinemaLabel(c))}</span></button></li>\`);
    } else {
      rows.push(\`<li class="city">\${esc(city)}</li>\`);
      for (const c of cs.sort((a, b) => a.name.localeCompare(b.name, 'pl')))
        rows.push(\`<li><button type="button" class="sub" data-id="\${c.id}" aria-current="\${c.id === cinemaId}"><span class="c">\${esc(cinemaLabel(c))}</span><span class="n">\${esc(c.street.replace(/\\s*\\d{2}-\\d{3}.*$/, ''))}</span></button></li>\`);
    }
  }
  pickList.innerHTML = rows.join('');
};
const openPicker = () => { renderPicker(''); pickSearch.value = ''; picker.showModal(); setTimeout(() => pickSearch.focus(), 50); };
pickSearch.addEventListener('input', () => renderPicker(pickSearch.value));
$('#pick-close').addEventListener('click', () => picker.close());
picker.addEventListener('click', e => { if (e.target === picker) picker.close(); });
pickList.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  picker.close();
  if (b.dataset.near) return locate();
  chooseCinema(b.dataset.id);
});
$('#cinemabtn').addEventListener('click', openPicker);
$('#pick-welcome').addEventListener('click', openPicker);

const chooseCinema = id => {
  cinemaId = id;
  try { localStorage.setItem('nacodokina.cinema', id); } catch {}
  render();
};

// nearest cinema by straight-line distance
const dist = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const setStatus = t => { $('#status').textContent = t; $('#status-welcome').textContent = t; };
const locate = () => {
  if (!navigator.geolocation) { setStatus('Przeglądarka nie udostępnia lokalizacji — wybierz kino z listy.'); return; }
  setStatus('Szukam najbliższego Heliosa…');
  navigator.geolocation.getCurrentPosition(p => {
    const best = cinemas.map(c => ({ c, km: dist(p.coords.latitude, p.coords.longitude, c.lat, c.lon) })).sort((a, b) => a.km - b.km)[0];
    chooseCinema(best.c.id);
    setStatus(\`Najbliżej: \${best.c.city}, \${best.km.toFixed(best.km < 10 ? 1 : 0)} km w linii prostej.\`);
  }, () => { setStatus('Nie udało się pobrać lokalizacji — wybierz kino z listy.'); }, { timeout: 8000 });
};
$('#near-welcome').addEventListener('click', locate);

// ---------- render ----------
function render() {
  const hasCinema = !!cinemaId;
  $('#welcome').hidden = hasCinema; $('#main').hidden = !hasCinema; $('#cinemabtn').hidden = !hasCinema; $('#days').hidden = !hasCinema;
  $('#daylabel').textContent = dayLabelFor(day);
  if (!hasCinema) { document.title = 'Na co do kina'; return; }
  const c = DATA.cinemas[cinemaId];
  $('#cb-city').textContent = c.city; $('#cb-name').textContent = cinemaLabel(c) + ', ' + c.street.replace(/\\s*\\d{2}-\\d{3}.*$/, '');
  document.title = \`Na co do kina · \${c.city}\`;

  const from = $('#from').value, to = $('#to').value, lang = $('#lang').value;
  const dayWord = day === DATA.days[0] ? 'dziś' : day === DATA.days[1] ? 'jutro' : dayLabelFor(day).split(',')[0];
  $('#duo').setAttribute('aria-pressed', duo);
  $('#legend-what').textContent = duo ? 'pary = dwa sąsiednie fotele w dobrej strefie (środek sali, tylne rzędy)' : 'dobre miejsca = środek sali, tylne rzędy';
  const cutoff = from === 'now' ? (day === DATA.days[0] ? Date.now() : 0) : new Date(\`\${day}T\${from}:00+02:00\`).getTime();
  // "wychodzę przed 00:30" means the next calendar day
  const limit = to === 'none' ? Infinity : new Date(\`\${day}T\${to}:00+02:00\`).getTime() + (to < '06:00' ? 86_400_000 : 0);
  const shows = DATA.screenings.filter(s => s.cinemaId === cinemaId && s.day === day && new Date(s.start).getTime() >= cutoff && new Date(s.end).getTime() <= limit
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
  $('#summary').textContent = \`\${films.length} \${plural(films.length, 'film', 'filmy', 'filmów')}, \${shows.length} \${plural(shows.length, 'seans', 'seanse', 'seansów')}\`;

  const ratingHtml = (m, big) => {
    const im = m.imdb;
    const rc = !hasRating(m) ? 'none' : im.rating >= 7.5 ? '' : im.rating >= 6.5 ? 'mid' : 'lo';
    return hasRating(m)
      ? \`<a class="rating \${rc}" href="https://www.imdb.com/title/\${im.id}/" target="_blank" rel="noopener" title="\${esc(im.title)} (\${im.year}) na IMDb"><span class="lbl">IMDb</span><span class="num">\${im.rating.toFixed(1)}</span><span class="vt">\${fmtVotes(im.votes)} głosów</span></a>\`
      : \`<div class="rating none"><span class="lbl">IMDb</span><span class="num">\${im && im.rating != null ? im.rating.toFixed(1) : '—'}</span><span class="vt">\${im && im.rating != null ? \`tylko \${im.votes} \${plural(im.votes, 'głos', 'głosy', 'głosów')}\` : 'brak oceny'}</span></div>\`;
  };
  const metaHtml = m => {
    const genres = m.genres.join(', ');
    const dur = m.duration ? \`\${Math.floor(m.duration / 60)} h \${String(m.duration % 60).padStart(2, '0')} min\` : '';
    return \`<p class="meta">\${m.year ? \`<span>\${esc(m.year)}</span>\` : ''}\${genres ? \`<span>\${esc(genres)}</span>\` : ''}\${dur ? \`<span>\${dur}</span>\` : ''}\${m.country ? \`<span>\${esc(m.country)}</span>\` : ''}\${m.age ? \`<span class="age">\${esc(m.age)}</span>\` : ''}</p>\`;
  };
  function heroHtml(f) {
    const m = f.m, im = m.imdb;
    const best = f.shows.find(s => !s.seats || goodOf(s.seats) >= (duo ? 4 : 6)) ?? f.shows.find(s => !s.seats || goodOf(s.seats) >= 1);
    const others = f.shows.filter(s => s !== best);
    const until = best.day === DATA.days[0] ? untilText(best.start) : '';
    const g = best.seats ? goodOf(best.seats) : null;
    const why = [\`<b>\${im.rating.toFixed(1)}</b> na IMDb\`, \`seans o <b>\${hhmm(best.start)}</b>\${until ? \` (\${until})\` : ''}, koniec \${hhmm(best.end)}\`,
      g >= 1 ? (duo ? \`<b>\${g}</b> \${plural(g, 'para', 'pary', 'par')} obok siebie w dobrej strefie\` : \`<b>\${g}</b> \${plural(g, 'dobre miejsce', 'dobre miejsca', 'dobrych miejsc')} jeszcze wolne\`) : ''].filter(Boolean);
    return \`<div class="poster">\${m.poster ? \`<img src="\${esc(m.poster)}" alt="">\` : ''}</div>
      <div class="body">
        <div class="top"><div><p class="lbl">Typ na \${dayWord} · \${esc(c.city)}</p><h2>\${esc(m.title)}</h2>\${m.originalTitle && m.originalTitle !== m.title ? \`<p class="orig">\${esc(m.originalTitle)}</p>\` : ''}</div>\${ratingHtml(m)}</div>
        \${metaHtml(m)}
        <p class="why">Bo \${why.join(', ')}.</p>
        <div class="cta"><a class="buy" href="\${best.ticketUrl}" target="_blank" rel="noopener">Kup bilet na <b>\${hhmm(best.start)}</b> · \${verOf(best)}</a><button type="button" class="share" id="share" data-text="\${esc(\`Na co do kina \${dayWord} · \${c.city} (\${cinemaLabel(c)}): \${m.title} — \${im.rating.toFixed(1)} na IMDb, seans o \${hhmm(best.start)}\${g >= 1 ? (duo ? \`, \${g} \${plural(g, 'para', 'pary', 'par')} dobrych miejsc obok siebie\` : \`, \${g} \${plural(g, 'dobre miejsce wolne', 'dobre miejsca wolne', 'dobrych miejsc wolnych')}\`) : ''}\`)}">Wyślij znajomym</button>\${others.length ? \`<span class="more">inne godziny: \${others.map(s => hhmm(s.start)).join(', ')}</span>\` : ''}</div>
      </div>\`;
  }
  // the answer: best film that still has a seat worth sitting in (unknown seats count as fine)
  const pick = rated.find(f => f.shows.some(s => !s.seats || goodOf(s.seats) >= 1));
  $('#hero').innerHTML = pick ? heroHtml(pick) : '';
  $('#hero').hidden = !pick;

  const shareText = (f, s) => {
    const m = f.m, g = s.seats ? goodOf(s.seats) : null;
    return \`\${m.title}\${hasRating(m) ? \` — \${m.imdb.rating.toFixed(1)} na IMDb\` : ''}, \${dayWord} \${f.shows.map(x => hhmm(x.start)).join(', ')} · \${c.city} (\${cinemaLabel(c)})\${g >= 1 ? (duo ? \`, \${g} \${plural(g, 'para', 'pary', 'par')} dobrych miejsc obok siebie o \${hhmm(s.start)}\` : \`, \${g} \${plural(g, 'dobre miejsce wolne', 'dobre miejsca wolne', 'dobrych miejsc wolnych')} o \${hhmm(s.start)}\`) : ''}\`;
  };
  const row = (f, i, dim) => \`<li class="film\${dim ? ' film-dim' : ''}\${filmKey(f.m) === highlight ? ' hl' : ''}" id="film-\${filmKey(f.m)}">
      <div class="rank">\${i}</div>
      <div class="poster">\${f.m.poster ? \`<img src="\${esc(f.m.poster)}" alt="" loading="lazy">\` : ''}</div>
      <div class="body">
        <h2>\${esc(f.m.title)}</h2>
        \${f.m.originalTitle && f.m.originalTitle !== f.m.title ? \`<p class="orig">\${esc(f.m.originalTitle)}</p>\` : ''}
        \${metaHtml(f.m)}
        <ul class="chips">\${f.shows.map(chipHtml).join('')}</ul>
      </div>
      <div class="side">\${ratingHtml(f.m)}<button type="button" class="sharebtn" data-share="\${f.m.imdb?.id ?? f.m.id}" data-text="\${esc(shareText(f, f.shows[0]))}">Wyślij znajomym</button></div>
    </li>\`;
  $('#list').innerHTML = rated.length ? rated.map((f, i) => row(f, i + 1, false)).join('') : \`<li class="empty">Nic nie gra po wybranej godzinie w tym kinie.</li>\`;
  $('#unrated').innerHTML = unrated.length ? \`<h3>Bez wiarygodnej oceny</h3><ol class="films">\${unrated.map((f, i) => row(f, rated.length + i + 1, true)).join('')}</ol>\` : '';
}

$('#from').addEventListener('change', () => { try { localStorage.setItem('nacodokina.from', $('#from').value); } catch {} render(); });
$('#lang').addEventListener('change', () => { try { localStorage.setItem('nacodokina.lang', $('#lang').value); } catch {} render(); });
$('#to').addEventListener('change', () => { try { localStorage.setItem('nacodokina.to', $('#to').value); } catch {} render(); });
$('#duo').addEventListener('click', () => { duo = !duo; try { localStorage.setItem('nacodokina.duo', duo ? '1' : '0'); } catch {} render(); });

// share the pick: native sheet on phones, clipboard elsewhere
document.addEventListener('click', async e => {
  const b = e.target.closest('#share, [data-share]'); if (!b) return;
  const c = DATA.cinemas[cinemaId];
  const url = b.dataset.share && day === DATA.days[0] ? \`https://nacodokina.pl/k/\${c.slug}/\${b.dataset.share}\` : \`https://nacodokina.pl/k/\${c.slug}\`;
  const text = b.dataset.text;
  if (navigator.share) { try { await navigator.share({ title: 'Na co do kina', text, url }); } catch {} return; }
  try { await navigator.clipboard.writeText(\`\${text}\\n\${url}\`); setStatus('Skopiowano do schowka — wklej znajomym.'); }
  catch { setStatus(url); }
});
$('#days').addEventListener('click', e => {
  const b = e.target.closest('button[data-day]'); if (!b) return;
  day = b.dataset.day;
  for (const x of document.querySelectorAll('#days button')) x.setAttribute('aria-pressed', x === b);
  render();
});

// live occupancy straight from Helios (their API sends permissive CORS headers)
$('#refresh').addEventListener('click', async () => {
  const shows = DATA.screenings.filter(s => s.cinemaId === cinemaId && s.day === day && new Date(s.start).getTime() >= Date.now() && DATA.screens[s.screenId]);
  setStatus(\`Odświeżam zajętość \${shows.length} seansów…\`);
  let ok = 0;
  await Promise.all(shows.map(async s => {
    try {
      const r = await fetch(\`https://restapi.helios.pl/api/cinema/\${cinemaId}/screening/\${s.id}/occupancy\`);
      const taken = new Set((await r.json()).occupiedSeats ?? []);
      const sc = DATA.screens[s.screenId];
      s.seats = { free: sc.total - taken.size, total: sc.total, good: sc.zone.filter(id => !taken.has(id)).length, goodTotal: sc.zone.length,
        pairs: sc.pairs.filter(([a, b]) => !taken.has(sc.zone[a]) && !taken.has(sc.zone[b])).length, pairsTotal: sc.pairs.length };
      ok++;
    } catch {}
  }));
  render();
  setStatus(ok ? \`Miejsca aktualne na \${new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} (\${ok}/\${shows.length} seansów).\` : 'Nie udało się połączyć z Heliosem — zostały dane z migawki.');
});

render();
if (highlight) { const el = document.getElementById(\`film-\${highlight}\`); if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300); }
</script>
</body>
</html>
`;
