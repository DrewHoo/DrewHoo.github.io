---
title: "Getting Battle for Middle-earth II to run on an Apple Silicon Mac (no VM)"
description: "A field report on dragging BFME2 — a 2006 DirectX 9 game — to a working main menu on an M5 Mac through CrossOver and Rosetta, the four fixes it took, and the exact wall where it stops."
pubDate: 2026-06-19
heroImage: /blog/bfme2-apple-silicon-og.png
tags:
  - Apple Silicon
  - Mac gaming
  - CrossOver
  - Reverse engineering
  - BFME2
---

I spent a week trying to play a twenty-year-old game on a brand-new laptop, and I want to write down exactly what happened — partly because it's a fun reverse-engineering story, and partly because when I started, the entire public internet said it couldn't be done and offered no details on *why*.

> **How this was made — full disclosure.** The hands-on work behind this post was done by an AI coding agent: Anthropic's Claude, driving [Claude Code](https://claude.com/claude-code), working in my environment under my direction. The agent did the week of debugging — parsing the minidumps, repacking the `.big` archives, defeating the code-signing monitor, byte-patching MoltenVK — and wrote the first draft of this write-up. I set the goal, steered the investigation, reviewed everything, and I stand behind the findings; it's published under my name on that basis. So when I say "I" below, read it as "me and my very persistent robot." The point of doing it this way: **the agent burned a small fortune in tokens so the next person doesn't have to.**

The game is **The Lord of the Rings: The Battle for Middle-earth II** (2006). The laptop is an **Apple M5 MacBook**. No Boot Camp, no x86 Mac, no official Mac port — and the game is delisted, so you can't even buy it anymore. The only ways to run a 32-bit Windows DirectX 9 game on an Apple Silicon Mac are a **translation layer** (CrossOver/Wine, with Rosetta 2 handling the x86 instructions) or a **Windows-on-ARM virtual machine**.

This is the translation-layer story. **Short version: I got BFME2 to a fully working, audio-enabled, ultra-wide main menu under CrossOver — which, as far as I can tell, nobody had documented before for any *Battle for Middle-earth* title on Apple Silicon — but in-game units are invisible, so it's not truly playable on CrossOver yet.** If you just want to *play*, skip to [the VM route](#if-you-actually-want-to-play). If you want to know how the sausage gets made, read on.

> **The full technical reference and the tools** I wrote along the way (a SAGE `.big` archive tool, a minidump crash parser, and a one-shot crash fix) live in the companion repo: **[github.com/DrewHoo/battle-for-middle-earth-apple-silicon](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon)**.

## "Can you play BFME2 on a Mac?" — the honest answer

If you searched that and landed here: **mostly no, for now.** With the fixes below you can reach the menu and load the campaign on Apple Silicon under CrossOver, but the soldiers don't render — you get selection markers and shadows marching across an empty field. For an actually-playable game on an M-series Mac today, run it in a **Windows 11 ARM virtual machine** (Parallels, or the now-free VMware Fusion). Everything works there because the x86 code runs under Microsoft's own emulator against a real Windows kernel, sidestepping every problem below.

So why bother with CrossOver at all? Because "it can't be done" is irresistible, and because the *why* turned out to be a genuinely interesting tour through 2006-era engine code, Rosetta's quirks, macOS code-signing enforcement, and a Vulkan shader compiler.

## Where it starts: a crash before you see anything

BFME runs on EA's **SAGE engine** — the same one behind *Command & Conquer: Generals*. Getting the game *installed* under Wine is its own saga (the disc uses SafeDisc copy protection, which has no working driver under Wine, so you need a community "no-DVD" patch). But once installed, every single launch did the same thing: show the loading splash, peg the CPU, and crash to desktop before the main menu.

The game helpfully drops a `DUMP_*.dmp` file when it crashes. Those are standard Windows minidumps, and you don't need WinDbg to read the one number that matters — I wrote [a ~150-line Python parser](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon/blob/main/scripts/parse_minidump.py) for the exception stream. Every crash, byte for byte, was this:

```
exception : 0xC0000005  EXCEPTION_ACCESS_VIOLATION
address   : 0x00AB6AF8           (inside the game's own code)
access    : write of 0x08110000  (to unmapped memory)
```

A deterministic out-of-bounds **write**, in game code, totally independent of graphics or audio settings. The strings sitting near the fault were the tell: `UltraHigh`, `K7`, `2200`, `_MINIMUM_FOR_ULTRA_HIGH_LOD`. Those are from the engine's **GameLOD** (level-of-detail) system.

Here's the punchline. SAGE picks a graphics detail tier by running a **CPU speed benchmark written in raw x86 assembly** — it literally emits the `RDTSC` instruction and times it. Under Rosetta 2, the translated M5 benchmarks so absurdly fast that the engine matches it to the **"UltraHigh"** hardware profile, selects the top detail tier… and a bug in that apply path writes off the end of a buffer. On a 2006 CPU this code path was simply never exercised. (This is all confirmed in the now-open-sourced Generals engine code, and there are upstream bug-fix PRs for exactly this "broken benchmark value breaks the shell map" class of crash.)

You can't stop a hardcoded benchmark. But you *can* take away its options.

The CPU→preset table lives in a file called `gamelodpresets.ini`, which is packed inside a `.big` archive (`ini.big`). If you delete every preset row from that file, the engine has nothing to match and falls back to its built-in **VeryLow** default — which doesn't trip the bug. So I wrote [a tool to read and repack SAGE `.big` archives](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon/blob/main/scripts/bigtool.py) (the format is refreshingly simple — a magic header and a table of offsets, no compression), stripped the preset rows, and repacked. Combined with pinning the game to a single CPU core (`WINE_CPU_TOPOLOGY=1:0`, a long-known BFME workaround), **the crash vanished** and the title screen finally appeared.

That whole fix is now [one script](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon/blob/main/scripts/neuter_gamelod.py): point it at your `ini.big`, done.

## The menu that rendered black

Victory was brief. Past the crash, the title screen flashed up… and then the whole screen went black. The process was alive and rendering — it was just rendering nothing.

The Wine debug log named the culprit on the first try:

```
Shader library compile failed: fragment ... D3D9FixedFunctionPS ...
VK_ERROR_INVALID_SHADER_NV: Fragment shader function could not be compiled.
```

BFME2's menu is drawn with **D3D9 fixed-function pixel shaders**. CrossOver was routing them through **DXVK** (which turns DirectX into Vulkan) and then **MoltenVK** (which turns Vulkan into Apple's Metal). MoltenVK choked on that specific shader, so every draw call silently did nothing.

The fix here was almost anticlimactic after the crash hunt: **switch the graphics backend from DXVK to wined3d.** wined3d translates to OpenGL instead of Vulkan, handles fixed-function shading natively, and never touches MoltenVK. The menu rendered — logo, music, animated background, the works. At an ultra-wide 2560×1080, no less (the 2D HUD stretches a bit at 21:9; it's a 2006 engine).

## The wall: invisible armies

So why isn't this a "you can play BFME2 on your Mac!" post? Because when you actually start a battle, **the units don't draw.** You get the terrain, the UI, the selection circles, and unit shadows sliding around — but the soldiers themselves are invisible.

This is a known **wined3d limitation on macOS**: the OpenGL path for skinned (bone-animated) meshes mishandles the bone-matrix indexing, and macOS caps OpenGL at version 4.1, so there's no newer path to fall back to. I tried every wined3d shader backend (GLSL, ARB, fixed-function) — all render the menu, none render units.

"Fine," I thought, "use DXVK then — the same engine renders perfectly on Linux through DXVK." That sent me down a multi-day rabbit hole that's the most technically interesting part of the whole project, and I'll spare you the full version here (it's [in the repo](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon#dxvk-the-deep-dive-and-the-real-wall)). The highlights:

- macOS 26's **Code Signing Monitor** kills any attempt to swap MoltenVK inside the notarized CrossOver app — *even after you re-sign it*. The workaround is to copy the whole app outside `/Applications`, modify the copy, and ad-hoc sign that. A never-notarized app is allowed to load custom code; a tampered notarized one is killed at the hardware level.
- DXVK demands GPU features (geometry shaders) that Apple Silicon simply doesn't have. The only MoltenVK that *pretends* to have them is the patched one CrossOver ships. To run a newer one, I **binary-patched a single byte** in MoltenVK's `vkCreateDevice` feature check (flipping a `jne` to a `jmp`) so it stops rejecting the request. That worked — device creation succeeded.
- And then, with everything else solved, the fixed-function pixel shader **still wouldn't compile** — failing two different ways in two different MoltenVK binding modes, on two different MoltenVK versions. Both are bugs deep inside MoltenVK's SPIR-V→Metal compiler, unreachable by any configuration knob.

That's the real floor: **a shader-compiler bug, not a settings problem.** Fixing it would mean patching and rebuilding MoltenVK from source. I decided that was a good place to stop and write everything down instead.

## If you actually want to play

Run it in a **Windows-on-ARM VM**. Parallels Desktop and the now-free VMware Fusion both run Windows 11 ARM, which runs BFME1 and BFME2 (and the *Rise of the Witch-king* expansion) with visible units, full quality, and online multiplayer. None of the Rosetta benchmark crash or MoltenVK shader walls exist there, because you're running a real Windows kernel. It's the boring answer, and it's the right one.

## What I'm leaving behind

The point of doing this in the open is so the next person who types "BFME2 Apple Silicon" into a search box finds *something*. So:

- **[The full write-up and tools](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon)** — the complete technical reference, with every fix, the DXVK/MoltenVK deep-dive, and three dependency-free Python tools (the `.big` archive tool, the minidump parser, and the one-shot GameLOD crash fix), all validated against retail files.
- If you only take one thing: the **GameLOD crash fix** (neutering `gamelodpresets.ini` + single-core pin) is the key that unlocks the SAGE engine reaching its menu under Rosetta. That part is solid and reusable across BFME1, BFME2, and probably Generals/Zero Hour.

It's not a win, exactly. But it's a *map* — and the field had none.

And maps are for the people who come after. If you're chasing the same white whale — maybe you can patch SPIRV-Cross, coax the units into rendering, or spot the angle I missed — **please pick it up and finish it.** Everything I learned is in [the repo](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon) so you don't have to start from zero. I genuinely hope someone reads this, gets one step further than I did, and emails me a screenshot of an actual *battle* running on a Mac with no VM.

And if you do break through — units on screen, the shader compiling, *anything* past where I stalled — **[drop a comment and tell me](https://github.com/DrewHoo/battle-for-middle-earth-apple-silicon/discussions).** I'll update this post, credit you, and celebrate properly. Someone out there has the missing piece. It might be you.
