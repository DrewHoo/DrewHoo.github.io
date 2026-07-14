---
title: Get the Priest's Blessing
blurb: A code-review skill for Claude Code. Really handy — I've been using it for a few weeks to great effect. It'll either exorcise the demons from your codebase or confess when it's unable to quench the evil, rather than mount an inquisition against good code.
liveUrl: https://github.com/DrewHoo/get-priests-blessing
stack:
  - Claude Code
  - Agent skill
pinned: true
order: 38
updated: 2026-07-13
note: The archetype comes from First Round's engineering-superheroes article.
---

An agent skill that audits a bounded section of code through the eyes of **the
Priest** — the engineering archetype from First Round's
[engineering superheroes article](https://review.firstround.com/how-to-spot-and-magnify-the-powers-of-your-engineering-superheroes/)
whose superpower is righteousness and code quality. The Priest reads every API
as a legal contract, treats names as doctrine, and holds the code review as a
sacrament.

The design problem wasn't making the review rigorous — it was keeping the
Priest from devolving into the article's villains: the Zealot, who rewrites
working code to satisfy dogma nobody asked for, and the Baker, who over-applies
one favorite abstraction until it stops fitting the problem. So every finding
has to name the real reader it helps, and each audit ends with a
**confession** — the places where the Priest suspects its own zeal.

In practice: it either exorcises the demons from your codebase, or confesses
when it's unable to quench the evil — rather than mounting an inquisition
against good code.
