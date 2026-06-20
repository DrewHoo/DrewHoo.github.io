---
title: BFME2 on Apple Silicon
blurb: "Dragging The Battle for Middle-earth II — a 2006 DirectX 9 game — to a working main menu on an Apple Silicon Mac via CrossOver + Rosetta, no VM. The four fixes, a deep MoltenVK/DXVK rabbit hole, and clean-room tools — a SAGE .big archive tool and a minidump crash parser."
liveUrl: https://drewhoover.com/blog/bfme2-apple-silicon/
repoUrl: https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon
stack:
  - CrossOver / Wine
  - Rosetta 2
  - Python
  - Reverse engineering
pinned: true
order: 40
updated: 2026-06-19
note: The menu boots with audio + ultra-wide; in-game units are the open problem.
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
