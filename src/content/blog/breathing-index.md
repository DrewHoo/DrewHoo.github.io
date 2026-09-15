---
title: "Why the AQI doesn't match your asthma (and an index that does)"
description: "US AQI is the highest of six pollutant scores; 'Moderate' hides which one. Breathing Index is a free app that learns which pollutants trigger your asthma."
pubDate: 2026-09-15
heroImage: /blog/covers/breathing-index.png
aiWritten: false
tags:
  - asthma
  - air quality
  - AQI
  - AQHI
  - ozone
  - Breathing Index
---

I had the pleasure of visiting Amsterdam this summer, and I was both very excited (I love a walkable city) but also very nervous, though, since it was August, and I often get an asthma trigger between August and the end of September, depending on the region.

You might find this relatable or odd, but despite my worries, I tried to avoid looking at the AQI. Sometimes looking at it stresses me out and makes me react. But one evening I was walking briskly along the canals and noticed I couldn't breathe in all the way.
It wasn't hindering me too much, just noticeable. It was the first time I felt my asthma that trip, so I looked at the AQI, and it said "7 Insufficient". Yup! How refreshing to see 1) an AQI measure that describes what I'm feeling 2) an AQI measure near the top of its range
(Dutch LKI range is 1-11) that intuitively matches my sense of unease while breathing.

Contrast that with the US AQI, where I've had asthma attacks outdoors at a "Good" AQI of 30, and been completely fine on days with "Unhealthy for sensitive groups" 100+ AQIs.

## What does the AQI actually measure, and is it relevant to asthma?

In the US, our AQI is based on the [National Ambient Air Quality Standards (NAAQS)](https://www.epa.gov/criteria-air-pollutants/naaqs-table), which exist thanks to the 1970 amendments to the [Clean Air Act](https://en.wikipedia.org/wiki/Clean_Air_Act_%28United_States%29) (shoutout to the 91st United States Congress).

The design motivation for the standards behind the AQI are broad, and rightly so: air quality affects lots of folks in different ways, and standards like NAAQS should account for them. But accounting for a broad array of health concerns via an index that reduces to a single number means not being particularly useful for a single health concern; CO, NO<sub>2</sub>, and PM<sub>10</sub> aren't particularly well-linked to causing problems for asthmatics.

| Pollutant        | What it is                                                                           | AQI averaging window | Acute asthma evidence                                |
| ---------------- | ------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------- |
| PM<sub>2.5</sub> | Particles under 2.5 µm: smoke, exhaust, secondary aerosols                           | 24 hr                | Strong (epidemiology; wildfire smoke especially)     |
| PM<sub>10</sub>  | Particles under 10 µm: dust, road grit, pollen fragments (includes PM<sub>2.5</sub>) | 24 hr                | Weak                                                 |
| O<sub>3</sub>    | Ground-level ozone, formed from NO<sub>x</sub> + VOCs in sunlight                    | 8 hr                 | Proven in chamber studies; dose scales with exertion |
| NO<sub>2</sub>   | Nitrogen dioxide, mostly traffic combustion                                          | 1 hr                 | Modest; mainly amplifies allergen response           |
| SO<sub>2</sub>   | Sulfur dioxide, from sulfur-bearing fuel (coal, ships)                               | 1 hr                 | Proven in chamber studies, within minutes            |
| CO               | Carbon monoxide, incomplete combustion                                               | 8 hr                 | None (no airway mechanism)                           |

_Agent-compiled table. Averaging windows from EPA; the evidence column summarizes controlled-exposure and emergency-visit studies gathered in September 2026._

## How pollutants get translated to guidance

If you aren't asthmatic, you might not know that the US's AQI is this unnecessarily high resolution scale that goes from 0 to 500, and is broken down into six disjointed categories, driven by its aforementioned six constituent pollutants.

I've always found it frustrating to parse which part of the scale is supposed to be ok for me, and frustrating to see in practice that its rating does not often correlate with how well I can breathe. Turns out there's a very good reason for that.

<table>
<thead><tr><th>AQI</th><th>Category</th><th>EPA's guidance</th></tr></thead>
<tbody>
<tr style="background:#00E400;color:#000"><td>0–50</td><td>Good</td><td>Little or no risk</td></tr>
<tr style="background:#FFFF00;color:#000"><td>51–100</td><td>Moderate</td><td>Acceptable; unusually sensitive people may have symptoms</td></tr>
<tr style="background:#FF7E00;color:#000"><td>101–150</td><td>Unhealthy for Sensitive Groups</td><td>Sensitive groups may have effects; general public unlikely to</td></tr>
<tr style="background:#FF0000;color:#fff"><td>151–200</td><td>Unhealthy</td><td>Everyone may have effects; sensitive groups more serious</td></tr>
<tr style="background:#8F3F97;color:#fff"><td>201–300</td><td>Very Unhealthy</td><td>Health alert; everyone at increased risk</td></tr>
<tr style="background:#7E0023;color:#fff"><td>301–500</td><td>Hazardous</td><td>Emergency conditions; everyone affected</td></tr>
</tbody>
</table>

_Agent-compiled table. Bands, colors, and guidance text from EPA's AQI technical assistance document._

## How the US AQI is calculated: the highest of six pollutants

The AQI's number is just the highest value of any of its 6 sub-indexes for these different pollutants.
ie if PM<sub>2.5</sub> is 100 and that's the highest score among the 6 pollutants, the AQI is 100. Whether PM<sub>10</sub>, NO<sub>2</sub>, O<sub>3</sub>, SO<sub>2</sub>, and CO are each 99 or each 0, the AQI will still be 100.

And it's not great that CO/PM<sub>10</sub>/NO<sub>2</sub> inclusion in the index will gaslight you into thinking you don't have asthma if you can breathe on a 130 AQI day because PM<sub>10</sub> (or any pollutant that doesn't happen to be a trigger for you) is at 130.

Similarly, it'll be hard for you to figure out your trigger if it's often overshadowed by the pollutant that drives the index. For me, that was the case with ozone, which was often overshadowed by PM<sub>2.5</sub>, so I'd look at the AQI when it was hard to breathe, and think PM<sub>2.5</sub> was responsible.

## AQI vs. AQHI: how other countries score the same air

Other authorities make different choices in how constituent pollutants change their indices; in Canada, the [AQHI](https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index.html) is additive _and weighted_ across the three pollutants it measures, and that means that if O<sub>3</sub>, NO<sub>2</sub>, and PM<sub>2.5</sub> are all at 50, the US AQI calls that "Good", and the Canadian AQHI rates it as "High". Here are some other scenarios where various authorities disagree significantly:

<table>
<thead><tr><th>Scenario</th><th>US AQI</th><th>Canada AQHI</th><th>China AQI</th><th>UK DAQI</th><th>EU EAQI</th><th>Netherlands LKI</th><th>South Korea CAI</th></tr></thead>
<tbody>
<tr><td>PM<sub>2.5</sub> 35.4 µg/m³ only</td><td style="background:#FFFF00;color:#000">100 Moderate</td><td style="background:#0099CC;color:#fff">2 Low</td><td style="background:#FFFF00;color:#000">51 Good</td><td style="background:#31CF00;color:#000">3 Low</td><td style="background:#F0E641;color:#000">Moderate</td><td style="background:#FFC800;color:#000">8 Insufficient</td><td style="background:#00FF00;color:#000">100 Moderate</td></tr>
<tr><td>NO<sub>2</sub> 100 ppb only</td><td style="background:#FFFF00;color:#000">100 Moderate</td><td style="background:#CC0000;color:#fff">9 High</td><td style="background:#FFFF00;color:#000">94 Good</td><td style="background:#31CF00;color:#000">3 Low</td><td style="background:#7D2181;color:#fff">Extremely Poor</td><td style="background:#FF4B00;color:#fff">10 Bad</td><td style="background:#FFFF00;color:#000">143 Unhealthy</td></tr>
<tr><td>O<sub>3</sub> 70 ppb only</td><td style="background:#FFFF00;color:#000">100 Moderate</td><td style="background:#FFFF00;color:#000">4 Moderate</td><td style="background:#FFFF00;color:#000">81 Good</td><td style="background:#FFCF00;color:#000">5 Moderate</td><td style="background:#FF5050;color:#fff">Poor</td><td style="background:#FFC800;color:#000">7 Insufficient</td><td style="background:#00FF00;color:#000">83 Moderate</td></tr>
<tr><td>All three at the US Moderate ceiling</td><td style="background:#FFFF00;color:#000">100 Moderate</td><td style="background:#660000;color:#fff">10+ Very High</td><td style="background:#FFFF00;color:#000">94 Good</td><td style="background:#FFCF00;color:#000">5 Moderate</td><td style="background:#7D2181;color:#fff">Extremely Poor</td><td style="background:#FF4B00;color:#fff">10 Bad</td><td style="background:#FFFF00;color:#000">143 Unhealthy</td></tr>
<tr><td>All three at the US Good ceiling (9.0 / 54 ppb / 53 ppb)</td><td style="background:#00E400;color:#000">50 Good</td><td style="background:#FF0000;color:#fff">8 High</td><td style="background:#FFFF00;color:#000">55 Good</td><td style="background:#FFFF00;color:#000">4 Moderate</td><td style="background:#FF5050;color:#fff">Poor</td><td style="background:#FFC800;color:#000">7 Insufficient</td><td style="background:#00FF00;color:#000">88 Moderate</td></tr>
<tr><td>PM<sub>2.5</sub> 75 µg/m³ only (China's Good ceiling)</td><td style="background:#FF0000;color:#fff">164 Unhealthy</td><td style="background:#FFFF00;color:#000">4 Moderate</td><td style="background:#FFFF00;color:#000">100 Good</td><td style="background:#CE30FF;color:#fff">10 Very High</td><td style="background:#FF5050;color:#fff">Poor</td><td style="background:#FF4B00;color:#fff">10 Bad</td><td style="background:#FFFF00;color:#000">250 Unhealthy</td></tr>
</tbody>
</table>

_Agent-compiled table. Easily the best evidence of a need for a breathing index, rather than an air quality one. Each row is one day of steady air at the stated concentrations, run through every authority's published breakpoints. O<sub>3</sub> and NO<sub>2</sub> converted at 1.96 and 1.88 µg/m³ per ppb. Canada's AQHI is computed from the Stieb et al. formula; the others take the highest sub-index; South Korea adds 50 when two pollutants are Unhealthy, and the Netherlands adds one point when every pollutant lands in the same class. The LKI uses the class table in RIVM report 2014-0050 (hourly NO<sub>2</sub> and O<sub>3</sub>, 24-hour PM<sub>2.5</sub>)._

Canada's AQHI looks more sensitive and maybe more useful to asthmatics, but it is in fact a _mortality regression_ which predicts excess daily DEATHS from the pollutants it measures. So two things are frustratingly true: AQI is the best free tool available to asthmatics to understand if they're going to have a bad time, and AQI is most certainly not designed to help us do that.

So it was very refreshing to see the [LKI](https://www.luchtmeetnet.nl/) (the Netherlands equivalent) describe air quality in terms like "Insufficient" instead of "Moderate".

## A Breathing Index: an air quality index built for asthma

It got me thinking: what if, in addition to an Air Quality Index, which I am thankful for but which doesn't serve my needs, we had a Breathing Index instead? That just told you how easy it was going to be to breathe?

So, I made one! You can find it at [breathingindex.com](https://breathingindex.com/), and it's free to use! It won't tell you how easy it is to breathe out of the box because its whole purpose is to build your personal breathing index, and that requires you
logging how your breathing feels for a few days. It records your location, captures a vector (aka a list of numbers) of pollutant readings each time you log, and uses that to build your index. Note: your logs don't leave your own device. There's no server to speak of; the app is a PWA that runs entirely from your phone or browser. I'll eventually add paid accounts that'll let you opt into storing your info in a database, but I'm committed to keeping a version that is free, local, and very useful.

I've been using it for over a month, and I've learned two things very quickly:

1. Ragweed probably isn't a trigger for me! In the past I've had a mysterious asthma trigger that didn't show up very clearly on AQI measures, and ragweed was my best guess for its source. But I've logged easy breathing on days with a very high ragweed index.
2. Ozone is a much bigger problem for me than the other AQI pollutants; nearly every "Limiting" log from me involves high ozone.

As for the mysterious late September asthma trigger, I'm hoping it doesn't happen this year, TBH. But if it does, I will be logging it, and if there's not an explanation in the logs, you can bet I'll be looking for more data for my benefit and yours.
