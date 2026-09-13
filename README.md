# nacodokina.pl

Repertuar wszystkich kin Helios posortowany według oceny IMDb, z liczbą wolnych
„dobrych" miejsc przy każdej godzinie. Strona nieoficjalna.

## Jak to działa

```
node fetch.mjs   # Helios API → data.json  (repertuar 3 dni, plany sal, zajętość dzisiejszych seansów)
node build.mjs   # data.json → public/index.html (jedna statyczna strona z osadzonymi danymi)
```

- **Repertuar, sale, zajętość** — `restapi.helios.pl` (nieudokumentowane API aplikacji biletowej).
- **Ocena** — oficjalne datasety IMDb (`title.ratings.tsv.gz`, odświeżane codziennie, cache w `.cache/`).
- **Dopasowanie filmu → IMDb id** — TMDB (`TMDB_API_KEY`), wynik trzymany na stałe w `imdb-cache.json`.
  Bez klucza oceny dostają tylko filmy już obecne w cache. Ręczne poprawki: edytuj `imdb-cache.json`.
- **Ranking** — ocena ważona liczbą głosów (m = 2500, C = 6.5); poniżej 100 głosów film ląduje w „bez wiarygodnej oceny".
- **Dobre miejsca** — rzędy w 45–80 % głębokości sali × środkowe 40 % rzędu; liczone z planu sali i listy zajętych foteli.
  Przycisk „Odśwież miejsca" pobiera zajętość na żywo prosto z przeglądarki (API Heliosa odsyła CORS `*`).

## Deploy

GitHub Actions (`.github/workflows/build.yml`) co 30 min 06:00–23:00 buduje stronę i commituje
`public/index.html`; Vercel (integracja z GitHubem, Root Directory = `public`) wdraża każdy push.
Jedyny sekret: `TMDB_API_KEY`. Actions muszą mieć uprawnienie „Read and write" do repo (Settings → Actions → General).

Lokalnie: `npx serve public`.
