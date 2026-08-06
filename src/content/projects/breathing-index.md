---
title: Breathing Index
blurb: "A personal air quality index. Shows each pollutant separately, learns which ones affect you from your symptom diary, and predicts your day on a four-level scale, from 1 (clear) to 4 (dangerous)."
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

The composite AQI collapses every pollutant into one number with population-calibrated labels.
The project started with a concrete failure of that design: air labeled "insufficient" in
Amsterdam (Dutch LKI 7–8) was manageable for the same asthmatic lungs that struggled in Hamden,
CT under a US AQI of 70, labeled "Moderate."

Breathing Index shows every exposure variable (pollutants, heat, humidity) and marks each by
what the user's symptom diary establishes about it: confirmed trigger, suspected, or tolerated.
It predicts the day on a four-level behavioral scale, 1 (Clear) to 4 (Dangerous). When several
candidates are elevated at once, it reports the ambiguity instead of attributing the day to one
of them; later diary entries resolve it. A scoreboard view compares the official composite
indices against the logged ratings.
