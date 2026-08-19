#!/usr/bin/env bash
# Files the rv-dashboard architecture-review issues on GitHub.
#
# Prereqs: the GitHub CLI (https://cli.github.com), logged in as any
# account (public repos accept issues from anyone): `gh auth login`
#
# Usage: ./create-issues.sh

set -euo pipefail

REPO="mikehoover59/rv-dashboard"
DIR="$(cd "$(dirname "$0")" && pwd)/issues"

create() {
  local title="$1" file="$2"
  echo "==> $title"
  gh issue create -R "$REPO" --title "$title" --body-file "$DIR/$file"
}

create "Routing depends on the OSRM demo server — switch to a drop-in alternative or add a fallback" \
       "01-osrm-demo-server.md"

create "Pushed updates may never reach installed phones: make the service worker network-first" \
       "02-service-worker-updates.md"

create "Audible wind alarm is silent on iPhone: AudioContext blocked by autoplay policy" \
       "03-silent-alarm-ios.md"

create "Route forecasts match the wrong hour when a route crosses time zones (one-line fix)" \
       "04-timezone-forecast-matching.md"

create "Keep the screen on while driving with the Wake Lock API — no Capacitor needed" \
       "05-wake-lock.md"

create "Route planner silently trusts the geocoder's first guess — show the resolved destination" \
       "06-geocoder-ambiguity.md"

create "Add official NWS weather warnings along the route (free api.weather.gov)" \
       "07-nws-alerts.md"

create "RV-realistic ETAs: adjustable pace factor and break time" \
       "08-rv-realistic-etas.md"

create "Small correctness nits: start-stop sampling, forecast-horizon clamp, null precip, maskable icon" \
       "09-small-nits.md"

create "Add a CLAUDE.md (and a release skill) so AI coding assistants work well here" \
       "10-claude-md-agentic-setup.md"

echo
echo "All 10 issues created on $REPO."
