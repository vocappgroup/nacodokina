// GET /api/og?k=<slug> → share image (PNG) for that cinema's pick of the day.
// picks.json is written by build.mjs and bundled with the function (see vercel.json includeFiles).
import { readFile } from 'node:fs/promises';

let picksCache = null;
const picks = async () => (picksCache ??= JSON.parse(await readFile(new URL('../public/picks.json', import.meta.url), 'utf8')));

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://nacodokina.pl');
  const k = url.searchParams.get('k') ?? '';
  try {
    const data = await picks();
    const entry = data.cinemas[k];
    if (!entry) { res.status(404).setHeader('content-type', 'text/plain').send('unknown cinema'); return; }
    const { renderOg } = await import('../og.mjs');
    const png = await renderOg({ ...entry, dayLabel: data.dayLabel });
    res.status(200)
      .setHeader('content-type', 'image/png')
      .setHeader('cache-control', 'public, max-age=600, s-maxage=1800, stale-while-revalidate=3600')
      .send(Buffer.from(png));
  } catch (e) {
    console.error(e);
    res.status(500).setHeader('content-type', 'text/plain').send(`render failed: ${e?.stack ?? e}`);
  }
}
