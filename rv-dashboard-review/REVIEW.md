# Architecture review: mikehoover59/rv-dashboard

Reviewed at commit `1157d63` (2026-08-19). Live site: https://mikehoover59.github.io/rv-dashboard/

## What the app is

A vanilla HTML/CSS/JS progressive web app, hosted on GitHub Pages, with three features:

1. **Live tile** — GPS speed/altitude plus current temperature, wind, and gusts from Open-Meteo.
2. **Route planner** — geocodes a destination (Open-Meteo geocoder), gets a driving route (OSRM public demo server), samples 6 evenly-spaced stops, and shows the forecast at each stop's estimated arrival time.
3. **Wind alerts** — user-set thresholds (localStorage), red banner + Web Audio beep + vibration when current or forecast wind crosses them.

## Overall verdict

This is a genuinely well-built small app. Things that deserve explicit praise:

- **The no-framework, no-build choice is right** for the goals (one maintainer, GitHub Pages hosting, possible Capacitor wrap later). Don't let anyone talk you into React for this.
- **Clean module separation** — `geolocation.js` / `weather.js` / `routing.js` / `alerts.js` each own one concern behind a small IIFE namespace, and `app.js` only wires them to the DOM. This is textbook.
- **The README is better than most professional repos'** — explains accuracy caveats, install steps, and the deploy loop in plain language.
- Sensible engineering details: weather polled every 5 min instead of every GPS tick, service worker scoped to same-origin so API calls bypass the cache, `wasAlarming` edge-triggering so the alarm doesn't re-fire every refresh, defensive `localStorage` parsing.

The issues below are ranked. The top three are the ones worth fixing first: two of them can make the app **appear broken in the field** (routing outage, stale cached version), and one means the **alarm — the safety feature — is probably silent on iPhones**.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 1 | High | Route planner's only backend is `router.project-osrm.org`, the OSRM *demo* server — rate-limited, no availability guarantee. One outage kills the feature. Drop-in alternative exists (FOSSGIS `routing.openstreetmap.de`), or add a fallback chain. |
| 2 | High | Cache-first service worker + manual `CACHE_NAME` bump means a pushed fix may never reach installed phones. Switch shell caching to network-first-with-offline-fallback. |
| 3 | High | The audible alarm is created outside a user gesture, so browser autoplay policy (iOS Safari especially) leaves the `AudioContext` suspended — silent alarm. `navigator.vibrate` also doesn't exist on iOS. Unlock one shared context on first user interaction; add a "Test alarm" button. |
| 4 | Medium | Timezone bug: Open-Meteo hourly timestamps (`timezone=auto`) are local wall-clock strings that `new Date()` reinterprets in the *phone's* zone, so forecast-to-ETA matching is off by an hour+ whenever a route crosses a timezone. One-line fix: `&timeformat=unixtime`. |
| 5 | Medium | The README says keeping the screen awake needs Capacitor — it doesn't. The web Wake Lock API (`navigator.wakeLock`) works on iOS 16.4+/Android Chrome. Also the honest caveat: JS pauses in background, so alerts only refresh while the app is visible — wake lock keeps it visible. |
| 6 | Medium | Geocoder silently takes the first hit (`count=1`). "Springfield" routes to the wrong state with no visible clue. The resolved name is already computed but never shown. |
| 7 | Nice | Add official NWS warnings (`api.weather.gov` — free, keyless, CORS-enabled) alongside personal thresholds: High Wind Warnings, severe storms, dust, winter weather along the route. |
| 8 | Nice | ETAs use OSRM car-speed, nonstop durations. RVs run slower and take breaks; end-of-day forecasts can pick the wrong hour. Add an adjustable speed factor + break padding. |
| 9 | Low | Small nits: route-stop sampling picks the 2nd coordinate for the "Start" stop; `closestHour` silently clamps beyond the 3-day window; `precipPct` can render "null%"; `purpose: "any maskable"` shares one icon for both purposes. |
| 10 | Dev | No `CLAUDE.md` / agent guidance. The repo has invisible landmines (bump `CACHE_NAME` per release, keep `SHELL_FILES` in sync, no-build constraint, GPS-needs-HTTPS testing) that an AI assistant — or future-you — will trip on. Ready-to-paste `CLAUDE.md` provided, plus a skills pointer. |

Full write-ups with code sketches are in `issues/*.md`, one file per finding, ready to paste into GitHub (or run `create-issues.sh` to file them all with the `gh` CLI).

## Agentic engineering pointers (the short version)

1. **Commit a `CLAUDE.md`** at the repo root — issue 10 contains a complete one to paste. It encodes the project's constraints (no build step, vanilla JS module pattern, deploy = push to main, the service-worker versioning rule, how to test) so Claude Code sessions start out already knowing the rules instead of rediscovering — or violating — them.
2. **Or run `/init`** in a Claude Code session inside the repo — it generates a starter `CLAUDE.md` from the codebase; then keep the "gotchas" section from issue 10.
3. **Add a release skill** (`.claude/skills/release/SKILL.md`): a checklist Claude follows on every deploy — verify `SHELL_FILES` matches the files on disk, bump `CACHE_NAME`, sanity-check on a local server, commit with a descriptive message, push. Skills turn "things dad has to remember to tell Claude" into things Claude does by default.
4. **Keep sessions scoped.** One feature or fix per session/branch; the repo is small enough that Claude can hold all of it in context, which makes reviews and refactors reliable.
5. **A `LICENSE` file** (MIT is the natural fit) isn't agentic, but it's the one repo-hygiene gap worth closing — right now nobody may legally reuse this code, including on forums where he might want to share it.
