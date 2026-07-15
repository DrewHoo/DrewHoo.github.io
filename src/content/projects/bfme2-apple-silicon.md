---
title: BFME2 on Apple Silicon
blurb: My agent gave their best shot at getting BFME2 running natively on an m-series mac--it got farther than was documented elsewhere on the internet, so AFAICT this is the bleeding edge and I asked it to write this blog post and publish this repo in hopes it helps someone cross the finish line.
liveUrl: https://drewhoover.com/blog/bfme2-apple-silicon/
repoUrl: https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon
tags:
  - video games
  - engineering
stack:
  - CrossOver / Wine
  - Rosetta 2
  - Python
  - Reverse engineering
cover: /blog/bfme2-apple-silicon/box-art.jpg
coverAlt: The Battle for Middle-earth II box art — an Elf and a Dwarf mid-battle
pinned: true
order: 40
updated: 2026-06-19
---

Not a data-viz experiment — a compatibility deep-dive. **The Lord of the Rings:
The Battle for Middle-earth II** (2006) is a delisted, Windows-only, DirectX 9
game on EA's SAGE engine. There's no native Apple Silicon build, so I tried to
run it on an **M5 Mac** through CrossOver/Wine + Rosetta 2 — no virtual machine.

It works as far as a **fully rendered, audio-enabled, ultra-wide main menu** that
loads the campaign — the first such result I can find documented for any *Battle
for Middle-earth* title on Apple Silicon via a translation layer. The four fixes:
neuter the SAGE GameLOD CPU benchmark (which crashes under Rosetta), pin to one
core, use the wined3d backend (DXVK black-screens on MoltenVK), and restore
CoreAudio. The remaining wall — invisible in-game units — bottoms out at a
MoltenVK shader-compiler bug.

- **Read it:** [the full field report](https://drewhoover.com/blog/bfme2-apple-silicon/)
- **Tools + technical reference:** [github.com/DrewHoo/battle-for-middle-earth-apple-silicon](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon)
