---
title: "Why deadlines are hard (and why forecasts are better)"
description: "Everyone knows the four hardest problems in software engineering include meeting deadlines; here's how forecasts provide better clarity than fixed deadlines."
pubDate: 2024-12-16T05:00:00Z
heroImage: /blog/covers/why-deadlines-are-hard-and-why-forecasts-are-better.png
tags:
  - software development
  - Estimation
  - deadlines
  - project management
---

Everyone knows the four hardest problems in software engineering are

- cache invalidation
- off-by-one errors
- meeting deadlines
- naming things

This post is about the 2nd problem: meeting deadlines.

## Why it's hard

I'm actually not going to get into all the reasons this is such a hard problem; I'm saving that for a future post called *What the trades can tell us about estimation*.

Besides, each organization has different reasons for why this is a hard problem. Instead, I'm going to describe a way to solve the problem, and it requires re-examining what we want from a deadline.

## What do we want from deadlines, anyway?

A deadline is most often a way of expressing "we want to pay this much for this work", after all, software development time is not cheap! And there's never a shortage of ways we need to spend it.

We also know the amount that organizations are willing to pay for a feature is best represented as a range, and the original deadline is the bottom end of the range. We know this because when deadlines are missed, the work is not abandoned!

Instead, when a deadline is missed, we try to cut scope or add resources to get the job done faster so that we don't exceed the top end of the price range (which is often unstated or unknown!). Well, why wait until a deadline is missed?

If what organizations want is up-to-date information so they can pull the levers within reach to achieve the best outcome for the business, then deadlines are a TERRIBLE way to think about delivery.

What organizations need are *forecasts*.

Just the term **forecast** better represents the complexity of delivering software than simple deadlines; deadlines are *missed* (shame on you for missing a deadline!) forecasts are *updated* (good job, you learned something and updated everyone).

Consider how the same project update gets communicated differently:

> It's looking like we aren't going to make our original deadline of April 1. We're now planning to release on April 5.

versus

> Our previous forecast put delivery between April 1 and April 7. We encountered some unexpected problems, so our newest forecast projects delivery between April 5 and April 12.

The forecast update *looks* way better and better communicates the difficult work your team is doing to the rest of the company.

## Hurricane forecasts as a model

[xkcd comic #1126](https://xkcd.com/1126/) tells the story of a hurricane that bizarrely defied NOAA's predictions for far longer than anyone thought was possible. Here's a panel from that cartoon depicting meteorologists after a week of creating forecasts that turned out to be wrong:

![A four-panel comic about a persistent hurricane named Epsilon. Two characters sit at computers, making observations over time. Monday at 4 PM, they note the well-organized cloud pattern. Monday at 10 PM, Epsilon seems weaker. By Tuesday at 4 AM, they have nothing new to say. Finally, Wednesday at 4 AM, Epsilon is still a hurricane, despite expectations.](/blog/images/hurricane-forecast-comic.jpeg)

Anyone who has ever had to communicate progress of a large software deliverable will find that comic uncomfortably relatable. Turns out, hurricanes are a great analogue for large software projects:

- When and where hurricanes land can have huge consequences, and people need adequate time to prepare!
- They're complicated, subject to complex interactions with other systems, and are therefore hard to predict.
- You can give them a deadline to make landfall, and they will ignore it.

The biggest difference between forecasting hurricanes and forecasting software projects is that hurricane forecasts have really serious stakes: people rely on them for safety. That makes them an excellent source of inspiration for how we should forecast the delivery of software. Think about the properties of a hurricane forecast:

- The forecasts are continuous; they're updated as frequently as there is new information to feed to the forecast algorithm.
- They are programmatic; they're generated using computer models, not Bob eyeballing the cyclone and saying "nah, Tampa will probably be ok".
- They are probabilistic; they communicate a range of possible outcomes instead of specific point where the hurricane is expected to land.
- They are broadcasted; *everyone* who may be affected can tune in.

Below, I'm going to discuss how to make software delivery forecasts that have these same traits.

## How to make a good forecast

### Set up your weather stations

Contrary to how agile projects are traditionally run, you've got to ensure that--however you're tracking the work--the team's current knowledge of the complexity of the work (as well as doubts!) are continually being turned into artifacts that a forecasting formula can use as inputs.

Estimates of individual tickets are the most helpful artifacts, and estimates are usually optimistic (which is to say they're usually bad), and there's no getting around that; fixing the human condition is out of scope. But keep estimating, and keep calibrating on past estimates to get good signal.

### Use (metal) computers

Whether you're tracking sprints or cycle time, nothing is worse than using a meat computer to answer the question "so when's that gonna be done?". It's extra effort, but the real reason is that humans don't like giving bad news, and the most valuable forecasts are precisely the ones that tell you to head for the proverbial hills!

Just as you wouldn't ask the poor beach correspondent where the hurricane is headed, you're unlikely to get a good forecast from the engineer who spends all their time heads-down crushing tickets. "THE WIND IS REALLY STRONG!" is the most you should expect, or worse "it's actually quite calm, I think we're good".

Instead, your forecasting model should work at the push of a button, and be capable of producing numbers that are alarming, so the business can respond. This might result in abandoning the work! If that sounds like a bummer, remember there's nothing worse than finishing a project that fell way behind schedule, and then regretting that you started it in the first place. Trust me, I've been there!

### Provide a range of possible outcomes

For a sufficiently complex project, your first forecast will either be very wide or very wrong. Make sure it's wide!

It's easy to come up with a lower bound for a forecast. For the higher bound, think creatively about things that can go wrong, and map that to your inputs. The team gets a stomach bug. Someone leaves the company. An underlying assumption about the architecture turns out to be wrong, or it changes! The bigger the project, the wider the initial forecast should be: the difference between the lower bound and upper bound should resemble the difference between today and the lower bound.

I talked about how estimates are optimistic. To make matters worse, your team *knows* that forecasts are based on estimates, and it is tempting to estimate lower when you're feeling behind. This is where a wide forecast helps--if you represent the appropriate uncertainty in your forecast, the business understands the correct range of costs and there's less risk of feeling "behind schedule".

To be clear, this difficult-to-forecast dynamic is also a huge motivation for working lean and delivering the smallest possible unit of work that helps you learn something about your customer. Giant bets are risky and should be avoided! Sometimes projects are unavoidably big, though.

### Broadcast to de-risk

One way to de-risk complex projects is to literally broadcast your forecasts. Write it in a public channel, and be transparent about your inputs. The context you provide beyond just the dates helps others understand your work, its risks, and how it might affect their work. They might even pipe up with some insight that helps you!

There's one way we can cheat and NOAA can't: if you prioritize getting something working from end-to-end (even if contrived or incomplete), you will discover the big stuff that your forecast needs to account for. I could abuse the hurricane metaphor further by comparing the first end-to-end workflow to the hurricane hunter planes that fly through hurricanes to get better meteorological data, but this is already a tortured metaphor, so let's move on.

### Don't forecast like a meteorologist if you don't need to

*Aim small, miss small* as one of my favorite CTOs used to say.

If a project is forecasted to be delivered in 10 weeks, and it takes 20, that's a big deal. But, if a project is forecasted to be delivered in 1 week from start to finish, and it takes 2 weeks, that's generally not a big deal, even though it's also an error of 100%!

That means forecasting is not always helpful, and your time may be better spent getting work done than adhering to a heavy-weight process to facilitate forecasting.

After all, nobody wants NOAA spending tax dollars on dust devils!
