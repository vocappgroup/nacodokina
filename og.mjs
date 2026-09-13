// Renders the share image for one cinema's pick of the day (1200×630 PNG).
// Used by api/og.js on Vercel and by `node og.mjs <slug>` locally.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';

const font = async name => readFile(new URL(`./fonts/${name}.ttf`, import.meta.url));
let fontsPromise;
const fonts = () => (fontsPromise ??= Promise.all([
  font('Oswald-600').then(data => ({ name: 'Oswald', data, weight: 600, style: 'normal' })),
  font('IBMPlexSans-500').then(data => ({ name: 'Plex', data, weight: 500, style: 'normal' })),
  font('IBMPlexSans-400').then(data => ({ name: 'Plex', data, weight: 400, style: 'normal' })),
]));

const h = (type, style, ...children) => { children = children.filter(c => c != null); return { type, props: { style, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } }; };
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;

export async function renderOg(entry) {
  const p = entry.pick;
  const gold = '#E3B341', ink = '#E8EAF0', ink2 = '#AEB4C4', ink3 = '#7B8194', bg = '#101318', surface = '#181C24';
  const dayWord = entry.dayLabel;
  const seatLine = p?.good != null ? (p.good >= 1 ? `${p.good} ${plural(p.good, 'dobre miejsce', 'dobre miejsca', 'dobrych miejsc')} jeszcze wolne` : 'zostały tylko boki') : null;

  const body = p ? h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', gap: 18 },
      h('div', { display: 'flex', fontFamily: 'Plex', fontWeight: 500, fontSize: 22, letterSpacing: 3, color: gold, textTransform: 'uppercase' }, entry.label ?? `Typ na ${dayWord} · ${entry.city}`),
      h('div', { display: 'flex', fontFamily: 'Oswald', fontSize: p.title.length > 22 ? 64 : 80, lineHeight: 1, color: ink }, p.title),
      p.orig && p.orig !== p.title ? h('div', { display: 'flex', fontFamily: 'Plex', fontSize: 28, color: ink2, fontStyle: 'italic' }, p.orig) : null,
      h('div', { display: 'flex', alignItems: 'center', gap: 22, marginTop: 8 },
        p.rating != null ? h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#2E2610', color: '#F4D27A', borderRadius: 12, padding: '14px 22px' },
          h('div', { display: 'flex', fontFamily: 'Plex', fontSize: 16, letterSpacing: 3, fontWeight: 500 }, 'IMDb'),
          h('div', { display: 'flex', fontFamily: 'Oswald', fontSize: 56, lineHeight: 1 }, p.rating.toFixed(1))) : null,
        h('div', { display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Plex', fontSize: 28, color: ink2 },
          h('div', { display: 'flex', gap: 12, alignItems: 'baseline' }, h('span', { fontFamily: 'Oswald', fontSize: 44, color: ink }, p.time), h('span', {}, `· ${p.ver}`)),
          seatLine ? h('div', { display: 'flex', alignItems: 'center', gap: 10, color: p.good >= 6 ? '#5CCB8A' : p.good >= 1 ? gold : '#E27272' }, h('div', { width: 14, height: 14, borderRadius: 7, background: p.good >= 6 ? '#5CCB8A' : p.good >= 1 ? gold : '#E27272' }), seatLine) : null)))
    : h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', gap: 18 },
      h('div', { display: 'flex', fontFamily: 'Plex', fontWeight: 500, fontSize: 22, letterSpacing: 3, color: gold, textTransform: 'uppercase' }, entry.city),
      h('div', { display: 'flex', fontFamily: 'Oswald', fontSize: 64, lineHeight: 1.05, color: ink }, 'Repertuar posortowany po ocenach IMDb'),
      h('div', { display: 'flex', fontFamily: 'Plex', fontSize: 28, color: ink2 }, 'z wolnymi dobrymi miejscami przy każdej godzinie'));

  // no pick (generic card for the front page): text-only layout
  if (!p) {
    const generic = h('div', { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: bg, padding: 64, justifyContent: 'space-between', fontFamily: 'Plex' },
      h('div', { display: 'flex', flexDirection: 'column', gap: 22 },
        h('div', { display: 'flex', fontFamily: 'Plex', fontWeight: 500, fontSize: 24, letterSpacing: 4, color: gold, textTransform: 'uppercase' }, entry.city),
        h('div', { display: 'flex', fontFamily: 'Oswald', fontSize: 132, lineHeight: 1, color: ink, letterSpacing: 2 }, 'NA CO DO KINA'),
        h('div', { display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Plex', fontSize: 34, color: ink2, marginTop: 10 },
          h('div', { display: 'flex', gap: 14, alignItems: 'center' }, h('div', { width: 14, height: 14, borderRadius: 7, background: gold }), 'repertuar posortowany po ocenach IMDb'),
          h('div', { display: 'flex', gap: 14, alignItems: 'center' }, h('div', { width: 14, height: 14, borderRadius: 7, background: '#5CCB8A' }), 'wolne dobre miejsca przy każdej godzinie'),
          h('div', { display: 'flex', gap: 14, alignItems: 'center' }, h('div', { width: 14, height: 14, borderRadius: 7, background: ink3 }), 'wolny od – wychodzę przed, we dwoje'))),
      h('div', { display: 'flex', justifyContent: 'space-between', fontFamily: 'Plex', fontSize: 24, color: ink3 }, h('span', {}, `${entry.cinema}`), h('span', {}, entry.url ?? 'nacodokina.pl')));
    const svg0 = await satori(generic, { width: 1200, height: 630, fonts: await fonts() });
    return new Resvg(svg0, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  }

  const tree = h('div', { display: 'flex', width: '100%', height: '100%', background: bg, padding: 48, gap: 44, fontFamily: 'Plex' },
    p?.poster ? { type: 'img', props: { src: p.poster, width: 356, height: 534, style: { objectFit: 'cover', borderRadius: 10, background: surface } } } : h('div', { width: 356, height: 534, borderRadius: 10, background: surface }),
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' },
      body,
      h('div', { display: 'flex', flexDirection: 'column', gap: 4 },
        h('div', { display: 'flex', fontFamily: 'Oswald', fontSize: 34, color: ink, letterSpacing: 1 }, 'NA CO DO KINA'),
        h('div', { display: 'flex', fontFamily: 'Plex', fontSize: 20, color: ink3 }, `${entry.cinema.toUpperCase() === entry.city.toUpperCase() ? 'Helios' : entry.cinema}, ${entry.city}  ·  ${entry.url ?? `nacodokina.pl/k/${entry.slug}`}`))));

  const svg = await satori(tree, { width: 1200, height: 630, fonts: await fonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const picks = JSON.parse(await readFile(new URL('./public/picks.json', import.meta.url), 'utf8'));
  const slug = process.argv[2] ?? Object.keys(picks.cinemas)[0];
  const png = await renderOg({ ...picks.cinemas[slug], dayLabel: picks.dayLabel });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(`/tmp/og-${slug}.png`, png);
  console.error(`/tmp/og-${slug}.png (${(png.length / 1024).toFixed(0)} KB)`);
}
