---
title: "How to make a good side project"
description: "Side projects occupy a unique space in software development. This guide explores what makes them successful by sharing lessons from building multiple tools over three years."
pubDate: 2024-12-19T05:00:00Z
heroImage: /blog/covers/how-to-make-a-good-side-project.jpeg
tags:
  - small frogs
  - software development
  - side project
---

Side projects occupy this weird space in our discipline, because they're halfway expected of you. No other discipline does this; if you're a technical writer, nobody is gonna ask you "do you have any technical writing side projects?"

I choose to interpret this phenomenon generously. One of my former colleagues, [Jaime Lightfoot](https://jaimelightfoot.com), gave a talk about the incredible power & responsibility we have as software developers, and this bit of the talk is burned into my brain:

> We [software developers] are pretty lucky: we get to transform worlds, and we get to build new ones. We're given the longest levers in the history of the world, and thoughtful, creative people to work alongside. We get hired to create things that are useful, that can help people, that can shape the course of people's days, their education, or their lives. People actually call us up and offer us money to do this.

This is perhaps the greatest expression of why I wake up in the morning and am happy to continue being software developer. It also helps explain our relationship with side projects; who wouldn't want to pull on the LONGEST LEVERS IN THE HISTORY OF THE WORLD occasionally in their spare time?

And with that context, let's talk about side projects.

### What makes a side project "good"?

There's a hierarchy of success here.

1. Build something that makes money and replaces your day job
2. Build something that gets real users
3. Build something that lets you learn a new skill
4. Build something that is fun to build

We'd all love to make a side project that makes us money. I'll be real with you: if I knew how to do that easily, I wouldn't be wasting my time writing this blog post.

I have built a side project that got real users, but I didn't set out with that goal. I didn't even set out to learn a new skill. I just wrote something for the fun of it.

#### Let me tell you about a card

In 2018 I got really into this digital card game called *Elder Scrolls: Legends*. It's like *Magic: The Gathering* or *Pokémon*, but on your phone and set in the Skyrim universe. Out of a set of 1200 possible cards, you build a deck of about 50 cards, and use that deck to fight other players. But there's a rule about decks (I promise I'll keep this exposition short): all cards have one of 5 colors, and a deck can contain cards of up to 3 different colors.

There's this one card that, by itself, kept inspiring me to start building side projects, and it's called Unite The Houses:

<!-- original image (Glitch CDN, now offline): https://cdn.glitch.global/bce2a4f6-4121-4d68-bc05-29e104f524e7/unite-the-houses.png -->
> 🃏 **Unite The Houses** — *"If you have at least one card of each attribute in play, you win the game."*

How do you achieve that win condition? That's where it gets fun: some cards can randomly generate other cards. Consider Barilzar's Tinkering:

<!-- original image (Glitch CDN, now offline): https://cdn.glitch.global/bce2a4f6-4121-4d68-bc05-29e104f524e7/barilzar-s-tinkering.png -->
> 🃏 **Barilzar's Tinkering** — *"Transform a creature into a random creature that costs 1 more."*

Hmmm... so each *cost* (which is a number between 0 and 12) has a different distribution of colors, and if you know the distribution of each cost, you can maximize your odds of achieving the win condition... this is starting to feel like poker! So I started building.

While writing this blog post, I realized I had *completely forgotten* about the first side project I built for *Legends*, way back in 2018. It's a repo of command line utilities written in python (I am surprised I wrote it in Python?! I wasn't using Python professionally then for sure) called [small frogs](https://github.com/DrewHoo/small-frog), which is a super deep cut Elder Scrolls reference, IYKYK.

Some time later, I built a static site on [Glitch](https://glitch.com) called [The Tinkering Table](https://glitch.com/~tinkering-table), which used the output of the `small frogs` side project to display stats on random card generation mechanisms, like Barilzar's Tinkering.

And I kept building tools to help with deckbuilding, which culminated in [The Shivering Deckbuilder](https://shiveringdeckbuilder.com/?deckCode=SPACrhbBAAAA), a site that has had a meaningful number of daily active users since I launched it in 2021.

#### Looking back at a trail of abandoned projects

When I released the deckbuilder, I remember pausing for a sec, and looking back at the trail of abandoned little side projects leading up to the thing I'd just launched. I was shocked by how many there were--it's hard to keep count, but it was something like 10 projects I'd abandoned over the course of THREE YEARS, and I'd even published most of them on Glitch!

If I were into hustle-culture, I'd get all Edisonian and be like "I discovered 10 ways not to build an app that got users" but I was just iterating and having fun. Each project I built was valuable and good *by itself*. Not gonna lie, I'm still proud of them.

### What you can learn from my experience

#### Learn to get started quickly

You know all those fiddly bits of web applications involving bundling and deploy configurations? That part sucks. I can deal with it professionally, but I hate it. Find a starter project you can easily clone and work with whenever you have an idea, because if you want to do web application side projects, you gotta get good at getting something out the door; the faster and easier you can share your idea with the world, the more fun you're having.

This is what I love about Glitch, and why I use it to write my blog; it's a service that lets you produce a deployed website lickety-split in the lowest-friction way imaginable. You don't think about it, just clone somebody else's project (you can clone this blog!), crack open that browser-based editor and punch the keys. Also, Vercel and Netlify both have great templates to use (they're real incentivized to get you up and running).

#### Learn to give up quickly

Had I tried to work on the same project for those three years between *small frogs* and *The Shivering Deckbuilder*, I would have for sure given up; projects get unwieldly as they get older & bigger and less fun to work on.

Remember how software engineers have access to the longest levers in the history of the world? You might have to remind yourself of this, and that `rm -rf` is one of those levers =)

<!-- original image (Glitch CDN, now offline): https://cdn.glitch.global/bce2a4f6-4121-4d68-bc05-29e104f524e7/im_bored.webp -->
> 🔥 *(A gif of Rick from Rick & Morty saying "I'm bored," then dousing the store he'd just opened in gasoline and lighting a match.)*

I contend to you that the secret to doing side projects right is abandoning them the very second that they stop being fun. Nobody gives a shit! Just hang it up, start over with a new idea, a new tech stack the next time you have inspiration. Build upon what you learned in your next project!

#### Play to your strengths

You don't have to pick a new tech stack or write clean code. Write ugly code. Use a crusty tech stack that you love. Break the rules. The only reason we even talk about clean code or antipatterns is in service of long-lived codebases where you're collaborating with lots of people. Side projects are not that. Nobody's gonna read your code, and if they do, it'll be because you made something awesome. Do weird stuff!

Confession time: for the deckbuilder, I wrote a [script to generate dynamic imports for each of the 1200 cards](https://github.com/DrewHoo/shivering-deckbuilder/blob/main/create-dynamic-image-imports.js) so that the bundler would separate each card image into a different chunk. It's a total abuse of the tool with downsides that would be significant in other settings! But it was a quick and dirty way to avoid sending a gigabyte bundle of pngs to anyone trying to access my site. And taking that nasty shortcut kept my eyes on the prize: sharing a thing I made with the rest of the world.

#### That's it, really

If you get started quickly, give up quickly, and play to your strengths, you're gonna build a bunch of stuff, fast. You've probably heard the parable of the two pottery classes, where one class was told to build as many pots (jars? idk) as fast as they could, and the other class got hours upon hours of instruction and theory, but barely made anything. Both classes were asked to build a final project at the end, and the first class absolutely smoked the second class despite having no formal instruction. Be like the first class. Slap your clay on the wheel and take it for a spin!
