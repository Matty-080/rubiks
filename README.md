# Rubikovka

Interaktivní průvodce skládáním Rubikovy kostky pro začátečníky. Zatím 2×2 (metoda po vrstvách), 3×3 a 4×4 jsou připravené jako pískoviště.

Úvodní stránka (`#/`) je rozcestník s výběrem kostky (živé 3D náhledy, odkaz „Pokračovat“ na poslední rozdělaný krok). Průvodce má adresy `#/2x2/<krok>`, `#/3x3`, `#/4x4`.

Web: https://matty-080.github.io/rubiks/ (GitHub Pages z větve `main`, nasadí se samo po každém pushi).

Spuštění lokálně: stačí otevřít `index.html` v prohlížeči (bez buildu, bez serveru, bez závislostí kromě Google Fonts).

## Struktura

| Soubor | Co dělá |
|---|---|
| `js/cube.js` | Simulátor kostky NxN (nálepkový model, tahy `R U F L D B`, `'`, `2`, `Rw`/`r`, `x y z`). Funguje i v Node. |
| `js/solver2x2.js` | Rozpoznání situací 2×2 a doporučení dalšího postupu („co dál?“). |
| `js/view3d.js` | 3D kostka v čistém CSS, animace tahů, šipka směru dalšího tahu, otáčení tažením. |
| `js/diagrams.js` | SVG náhledy situací (pohled shora a izometrie) generované ze stavu kostky. |
| `js/guide2x2.js` | Obsah průvodce 2×2 – kroky, varianty, karty situací. |
| `js/app.js` | UI: rozcestník, přehrávač, kroky, procvičování rozpoznání, stopky. |

Náhledy i ukázky se generují z algoritmů (stav = inverze algoritmu aplikovaná na složenou kostku), takže obrázek vždy odpovídá tahům.
