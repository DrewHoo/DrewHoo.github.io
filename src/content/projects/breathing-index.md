---
title: Breathing Index
blurb: "A personal air index, born the week the official AQI called a smoke day 'Moderate.' Shows every pollutant separately, learns which ones are yours from your symptom diary, and predicts your day on a scale of 1 (do anything) to 4 (stay inside)."
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

In Amsterdam, the Dutch air index read 7–8 — "insufficient" — and my asthmatic lungs worked
harder than usual but worked. Back home in Hamden, Connecticut, the US AQI read 70 out of 500,
"Moderate," and I couldn't finish a lap of the block. The composite AQI is a `max()` over
pollutant sub-indices: it hides what's in the air, and its labels are calibrated to the average
lung, which nobody has.

Breathing Index goes the other way. Every exposure variable on one screen — pollutants, heat,
humidity — each marked by what your own symptom diary has proven about it, and your day
predicted on a four-level scale defined by behavior, from 1 (do anything) to 4 (stay inside).
On a day when smoke and ozone spike together, it admits it doesn't know which one got you and
waits for the diary to settle it. There's also a scoreboard comparing what officials said to
what your lungs said. The officials are not doing great.
