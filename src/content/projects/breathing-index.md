---
title: Breathing Index
blurb: "A personal 1–4 air scale for people whose lungs disagree with the official AQI. Learns which pollutants actually get you from your own symptom diary, and predicts your day ahead of time."
liveUrl: https://drewhoover.com/breathing-index/
repoUrl: https://github.com/DrewHoo/breathing-index
tags:
  - data viz
  - health
  - PWA
stack:
  - TypeScript
  - React
  - Vite
  - TanStack Router
  - Open-Meteo
  - AirNow
cover: /projects/breathing-index.png
coverAlt: Breathing Index share card showing the four colored levels and an hourly prediction curve
pinned: false
order: 25
updated: 2026-08-06
---

Born from a bad-air week: Amsterdam's index said "insufficient" while breathing was manageable,
then Hamden's said "Moderate, 70/500" while walking was a struggle. The composite AQI is a
`max()` over pollutants — it can't tell you *what's* in the air, and its labels are calibrated
to a population, not to you.

Breathing Index shows every exposure variable (pollutants, heat, humidity), marks each one by
what your own symptom diary proves about it — confirmed trigger, suspected, tolerated — and
predicts your day on a four-level behavioral scale: Clear, Noticeable, Limiting, Indoors. The
inference is honest about ambiguity: on a day when smoke and ozone are both elevated, it won't
pretend to know which one got you until your diary disambiguates.
