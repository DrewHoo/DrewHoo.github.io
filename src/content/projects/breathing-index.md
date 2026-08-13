---
title: Breathing Index
blurb: "A personal air quality index. Shows each pollutant separately, learns which ones affect you from your symptom diary, and predicts your day on a four-level scale, from 1 (excellent) to 4 (dangerous)."
liveUrl: https://breathingindex.com/
repoUrl: https://github.com/DrewHoo/breathing-index
tags:
  - data viz
  - health
stack:
  - TypeScript
  - React
  - Vite
  - TanStack Router
  - PWA
  - Open-Meteo
  - AirNow
cover: /projects/breathing-index.png
coverAlt: "Breathing Index share card: a bar chart of one day's hourly air readings rising to a single red peak, above the scale from 1 Easy to 4 Dangerous"
pinned: false
order: 25
created: 2026-08-06
updated: 2026-08-07
---

The composite AQI collapses every pollutant into one number with population-calibrated labels.
The project started with a concrete failure of that design: air labeled "insufficient" in
Amsterdam (Dutch LKI 7–8) was manageable for the same asthmatic lungs that struggled in Hamden,
CT under a US AQI of 70, labeled "Moderate."

Breathing Index shows every exposure variable (pollutants, heat, humidity) and marks each by
what the user's symptom diary establishes about it: confirmed trigger, suspected, or tolerated.
It predicts the day on a four-level behavioral scale, 1 (Excellent) to 4 (Dangerous). When several
candidates are elevated at once, it reports the ambiguity instead of attributing the day to one
of them; later diary entries resolve it. A scoreboard view compares the official composite
indices against the logged ratings.
