# Traffic notes: the r/CFB weekend, 2026-09-19 to 09-23

*Agent-compiled from Mixpanel on 2026-09-23. Aggregate numbers only.*

## What happened

Drew posted [Hostile Territory](https://drewhoover.com/hostile-territory/) to r/CFB on Friday 9/19 as a link post titled "How bad is Kiffin's 1-8 record against top 10 teams on the road? Here's every other coach's record." (thread `1wl12tw`, 726 points, 97% upvoted, 189 comments). The site had done 27 unique visitors on Thursday. It did 5,646 on Friday and 5,858 on Saturday.

| Day | Unique visitors | Hostile Territory page views |
|---|---|---|
| Thu 9/18 | 27 | 1 |
| Fri 9/19 | 5,646 | 18,447 |
| Sat 9/20 | 5,858 | 18,653 |
| Sun 9/21 | 1,178 | 3,680 |
| Mon 9/22 | 422 | 1,374 |
| Tue 9/23 (partial) | 300 | 873 |

The first wave peaked one hour after posting at about 2,000 visitors in the hour. A second wave ran Saturday morning through midday. Both are project time in Mixpanel.

## Findings

1. **Page views overcount reading.** `trackPageviews` in `src/scripts/analytics-common.js` fires on every `replaceState`, and the project writes its filter state into the URL. About 22k of the 40k Hostile Territory views carry a query string. The honest read is ~13k unique visitors at ~3 URL states each.

2. **People used the controls.** `min` (9.9k), `q` (8.7k), `all` (6.7k), `cut` (6.7k) and `coach` (3.4k) query params all show up in the thousands. The search box was mostly used one letter at a time. 1,096 visitors opened a coach card, 5,431 opens total, median 2 per person, p90 of 11. So roughly one in twelve visitors went past the default view.

3. **Which coaches.** DeBoer 680 opens, then Day 272, Kiffin 267, Cignetti 261, Franklin 238, Sarkisian 229, Cristobal 201, Smart 194. Shared `?coach=` deep links rank the same way. The crowd was Alabama fans checking on their guy plus the thread's Kiffin angle.

4. **91% mobile.** iOS 8.8k, Android 3.4k, Mac 780, Windows 370. The phone layout is the layout.

5. **No spillover.** 64 of ~13k Hostile Territory visitors viewed any other page. 62 of those hit the home page. The projects index got 75 views all week.

6. **The Kiffin blog post was not discovered by reddit.** `/blog/lane-kiffin-road-record-vs-top-10/` got 77 views: 34 from the kagi crawler (see below), 32 from the home page, 6 direct, 5 from Google. The thread linked the project directly, so the post only got the handful of reddit visitors who wandered to the home page first.

7. **Other referrers to Hostile Territory,** unique visitors: 247sports.com 76, tidefans.com 8, Substack 3, a Microsoft Teams link 1, Facebook 4, Google 19.

8. **Breathing Index was untouched.** Prediction viewed: 1 to 7 uniques a day. Diary entry saved: 0 to 3 a day. Flat across two weeks, no weekend bump. The blog post shows 203 views but 105 came from the kagi crawler, so real reads are about 100.

## The kagi.com referrer is still a crawler

Kagi Small Web is a real product humans use, and it loads posts in an iframe, so `$referrer = https://kagi.com/` is what a human would produce too. The 14-day sample says these are not humans:

- 233 hits, 231 distinct Mixpanel device IDs, 233 `Post viewed` events, zero other interaction.
- 230 of 233 carry the exact same user agent string (Chrome 145 on Mac), screen width exactly 1,366, `framed = true`.
- Hits arrive every hour of the day including 1am to 7am, 1 to 9 per hour.
- The prior batch (week of 8/31) had the same shape with user agent `meta-externalagent/1.1`. The fingerprint changed, the behavior didn't.

The 3 Firefox hits at 2,560 wide are plausibly real people, or Drew.

## Where confusion surfaced in the thread

Read from the comments on 9/23. These are places some readers got confused, not a change list. The denominator: ~13k visitors, 189 comments, and the confused comments below come from about a dozen people. The thread itself (726 points, 97% upvoted), the volume of shared `?coach=` and `?min=` links, and one in twelve visitors opening coach cards all say the interface worked for most people as it was. The Franklin jokes are most of the thread.

- **Default filter.** About six readers said a coach was missing (Smart, Heupel, Sitake, Saban, Carroll, Lanning); each was behind the minimum-games filter or the current-coaches box, and other readers answered them before Drew did. The same filter is what makes the default view readable, and `min` and `all` were the most-used controls, so plenty of people found it on their own.
- **Neutral-site rule.** Four threads asked why a playoff or bowl result did or didn't count (Cristobal over Ohio State, DeBoer over Harbaugh, Lanning; Cignetti over Miami was petitioned and granted mid-thread). The rule is "home game for the top-10 team."
- **"True road games."** One reader called the data "almost all just straight up wrong," then edited: "true road games, I can't read."
- **0-x sort order.** One reader expected 0-10 to read as worse than 0-1. Drew explained the current order keeps well-known coaches easy to find.
- **Game-time rank vs final rank.** Two readers noted kickoff ranking credits wins over teams that finished unranked. Methodology, not a bug.
- Small: one reader read the tiny Kansas logo as the old Florida logo.
- Praise: "sick website my dude", "Big fan of your site. I really like the visuals."
- Follow-up post idea Drew surfaced in the thread: Saban was 0-6 at Auburn when Auburn was ranked, LSU years included.

## Housekeeping spotted

Fixed the same day in `src/scripts/analytics-common.js` and `src/layouts/BlogPost.astro`: local hostnames and the Small Web iframe no longer init Mixpanel, and blog posts send a `Post read` event once the reader has spent 15 seconds on the page and scrolled the article's end into view. `Post viewed` keeps its load-time meaning so older comparisons still hold. The two items below remain.

- `/blog/should-you-buy-at-an-all-time-high/` still gets hits alongside the project path, and `Post viewed` records two different titles for it.

## Open questions

- Nobody in the thread mentioned the phone layout, good or bad, with 91% of visitors on phones.
