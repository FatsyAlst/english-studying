# 🎧 Extra Study

Short extra sessions that sit alongside my book study: **one** lesson, episode, video or practice set at a time, always in **British English**.

[← Back to the main README](../README.md)

---

## How it works

1. When I want an extra session, I run the **"Extra English study pick"** task in Claude.
2. Claude takes the **next source in the rotation** (sources take turns evenly) and picks one short item from it that:
   - hasn't been picked before,
   - fits a single short session,
   - helps with British listening (especially fast, casual speech like British players in voice chat), or links to the grammar I'm studying.
3. Claude logs the pick straight away, so it's never suggested again.
4. Claude builds a **companion sheet** (LaTeX → PDF) to use *while* watching or listening:
   - warm-up questions before pressing play,
   - one card per key word or section, in the item's own order, with an Oxford-style definition, British IPA, examples and a "heard it at ___" timestamp box,
   - tip boxes on grammar (linked to *English Grammar in Use*), British pronunciation and real-life/gaming usage,
   - 4–6 short exercise sets, with the answer key on the last page.
5. The sheet is saved here, in its own folder, and the history below gets a new row.

There's **no fixed template**: each sheet follows its source's own style (colours, section names, tone). A BBC *6 Minute English* sheet looks like a *6 Minute English* lesson, and an *English by Jay* sheet looks like Jay's videos. The box system stays the same, so all the sheets still read as one series.

> The pick history is kept in a tracker in my Claude Project; this page mirrors it.

## Folder layout

```
extra-study/
├─ README.md                                  this page
└─ NNN-<short-slug>/                          one folder per pick
   ├─ extra-study-NNN-<short-slug>.tex        LaTeX source
   ├─ extra-study-NNN-<short-slug>.pdf        the companion sheet
   └─ img/                                    openly licensed images used in the sheet
```

To rebuild a sheet, run `pdflatex` on its `.tex` file twice, from inside its folder.

## Sources

Used in this order, wrapping round to the first one after the last.

| # | Source | Notes |
|:-:|--------|-------|
| 1 | [BBC Learning English](https://www.bbc.co.uk/learningenglish/index) | 6 Minute English, The English We Speak, Learning English from the News, 6 Minute Grammar, 6 Minute Vocabulary, Real Easy English… |
| 2 | [English by Jay](https://www.youtube.com/@englishbyjay.official) (YouTube) | British vocabulary and pronunciation |

## History

| # | Date | Source | Series / type | Item | Sheet |
|:-:|------|--------|---------------|------|-------|
| 001 | 2026-11-01 | English by Jay | Video · British vocabulary & pronunciation | [The English words you don't learn unless you go to England.](https://www.youtube.com/watch?v=IXuJSwk1gck) | [PDF](./001-english-words-england/extra-study-001-english-words-england.pdf) · [TeX](./001-english-words-england/extra-study-001-english-words-england.tex) |
