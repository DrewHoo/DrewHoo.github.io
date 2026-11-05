# DCA strategy builder, v1 spec

Status: draft for Drew's review, 2026-11-05. Nothing is built. The spec lives in the
index repo until the site's repo exists; it moves there as `specs/<site>.spec.md` with
`specs/research/` beside it, the way cfb-streak-king keeps its own. The research reports
behind it are [prior-art.md](research/prior-art.md), [price-data.md](research/price-data.md)
and [event-calendars.md](research/event-calendars.md). The site's name is open (Open
questions, 1); this document says "the site".

Users build a buying strategy out of a schedule (every Monday, the third Thursday of the
month, every full moon, the day after a Fed meeting) and up to four conditions (only after
the S&P 500 fell 2% in a day, only while the VIX is above 25, only while the security sits
under its 200-day average), and the app ranks every security in the universe by how that
strategy did for it since 1990 against plain dollar-cost averaging of the same money. The
"+" menu shows, beside every schedule, condition and choice it offers, how much adding it
would change the result, the way Streak King's menu shows the team that would lead under
each chip. The data ships as static files and every strategy evaluates in the browser, so a
menu with 300 options evaluates 300 strategies when it opens. Chrome, pages and plumbing are
Streak King's: the sentence with pickers, the board, the panel inline under its row, entity
pages, a calendar, named pages for search, weekly posts, the share worker. Hosting follows
the dataviz-pages-site pattern at drewhoover.com/<slug>/.

Nobody offers this. Portfolio Visualizer, testfol.io, Curvo and PortfoliosLab backtest a
portfolio with contributions on a calendar interval (monthly, quarterly, yearly), and
Portfolio Visualizer's timing models move the whole portfolio in or out on one signal;
dcabtc.com, dca-cc.com and a crowd of clones do one asset on an interval; Seasonax draws
seasonal averages; the buy-the-dip and lump-sum writeups (Maggiulli, Vanguard, Schwab) are
one-off studies with a fixed rule. None composes a schedule with conditions, none schedules
on an event (a Fed decision, a jobs report, earnings, an election, a full moon, even a
weekday), none ranks a universe under a rule, and none shows the per-option delta in the
menu. The prior-art report has the table, and one more gap it found: every calendar
anomaly in the literature has a "then it faded" chapter (the pre-FOMC drift, the Monday
effect, pre-holiday returns), and no tool shows that inline. This site does, with the edge
by decade on every panel.

## Strategy semantics

These definitions are the contract everything else builds on. One engine evaluates them
(`evaluate(strategy, series)`), used by the client, the prerender, the mine, the cards and
the worker, so no two views can disagree on a number.

- A **strategy** is a schedule, up to four conditions, a budget rule and a window. The
  **security** is the subject it is evaluated for; the board evaluates it for every security
  at once and the open row is one of them (`?t=spy`), the way a team is the open column on
  Streak King.
- A **trading day** is a day the NYSE was open. Holidays, the 2001-09-11 closure, Hurricane
  Sandy (2012-10-29/30) and the national days of mourning are data (`data/ref/calendar.json`,
  with receipts), not a rule.
- The **schedule** names calendar dates. A date that is not a trading day rolls forward to
  the next one: a Saturday full moon buys on Monday, a Sunday 15th buys on the 16th. Two
  dates that roll to the same trading day are one buy.
- A trading day **qualifies** when the schedule names it and every condition holds on it. A
  condition reads the buy day's own close and everything published by that close, and the
  buy fills at that close, which is a market-on-close order placed in the last minutes. So
  "the day the S&P 500 fell 2%" buys that day's close, "the morning of the jobs report"
  buys the close of that day, and "the day after a Fed meeting" is the next session's close.
- **Nothing reads the future.** Streak King's post-hoc chips (one-score games) read the
  game's own score, which is fine for a streak. Here a condition that saw tomorrow would
  make a strategy that always wins, so the catalog has none: no "on days the market rose",
  no "in recessions" (the NBER dates a recession about a year after it starts; Cut from
  v1). Macro series are read as first published (Data pipeline, vintages), because the
  unemployment rate a buyer saw in 1992 is not the one FRED shows today.
- **Budget rule.** Money arrives on a fixed cadence into cash, and a qualifying day spends
  the cash. The default is $100 a week; the engine accrues it per trading day (the annual
  amount over the year's trading days) so the budget cadence never interacts with the
  schedule. Uninvested cash earns the 3-month Treasury bill rate (FRED `DTB3`), and a word in
  the sentence switches it to nothing. This is the Vanguard and Maggiulli method: a strategy
  that waits for a 10% drop holds cash for years, and the comparison with plain DCA is on
  the same dollars on the same dates. The other structure, a fixed amount per buy, is a
  word too (`amt=fixed`): "every full moon" then invests a twelfth of "every trading day",
  so the board switches from dollars to the money-weighted annual return (IRR) while it is on.
- **Plain DCA**, the baseline every number is read against, is the same budget spent the
  day it arrives (every trading day, at the close). The board's number is the **edge**: the
  strategy's ending value over plain DCA's, less one, as a percent ("2.1% ahead of plain
  DCA", "1.4% behind"). The edge isolates the timing from the security's own return, which
  is why it compares across securities and plain dollars don't.
- Two more benchmarks sit in the panel, Schwab's named investors: **the year's money on day
  one** (each year's budget invested at that year's first close; Schwab's "Ashley") and
  **cash** (never invested, earning the bill rate). The lump-sum literature's "invest the
  windfall now" compares a pile against spreading it, which is a different question from
  money arriving over 36 years; the prior-art report flags the confusion, so the panel never
  says "lump sum" without saying which one. The windfall version (the window's whole budget
  at the first close) is a word in the budget menu for the Vanguard two-thirds gate.
- **Dividends** reinvest on the ex-date through the adjusted close; splits are adjusted.
  Fees, taxes, bid-ask spread and whole-share rounding are ignored. Method says all of it.
  The price-data report sizes the ex-date-versus-pay-date error.
- The **window** opens 1990-01-02 or at the security's first close, whichever is later,
  and closes at the latest close. A security that starts later says so in the sentence
  ("since 1998"). A word picks the start: 1990, 2000, 2010, 2020, or the security's start.
- A condition or schedule whose series begins after the window's start floors the window to
  the series' start and the sentence says why ("since 2003, where earnings dates begin"),
  the night-game rule from Streak King. Nothing is claimed for years the data can't see.
- **Ties and gaps.** A series with a missing close on a trading day (a fund that didn't
  price, a halted stock) neither buys nor is counted that day; the ledger marks it. A
  condition whose reference series is missing on a day doesn't hold that day.
- The numbers a strategy produces: ending value; dollars contributed; the edge; IRR; the
  ending value against the lump sum; the portfolio's worst drawdown; average cost per share
  against plain DCA's; buys made; average cash held; and the luck line below.

### The luck line, the windows and the decades

One path from 1990 is one draw. Three numbers keep a result honest, all from the same
engine, all in the panel, the first also in the footnote:

- **Luck.** Streak King's footnote reads "1 in 16 trillion by chance". Here the footnote
  says how a result compares with blind timing: "Among 1,000 random schedules with 443 buys
  over the same window, this one beat 61%." A bootstrap in a Web Worker over the open
  strategy only (1,000 schedules × 9,100 days, ~50 ms), never over the menu.
- **Windows.** "Beat plain DCA in 58% of the ten-year windows starting each month since
  1990." Maggiulli's and Vanguard's results are win rates across start dates, and that is
  the number every writeup in this literature leads with; one evaluation per start month
  (~320 windows), a few milliseconds.
- **Decades.** The edge for the 1990s, 2000s, 2010s and 2020s as four small numbers, the
  CXO Advisory sub-period panel. The pre-FOMC drift was 49 basis points a meeting from
  1994 to 2011 and gone after 2015; a strategy built on it should show that in the strip.

A stack of four conditions that beats plain DCA by 40% with 12 buys will read "beat 99% of
random 12-buy schedules", and Method says why that is still mostly luck: the reader chose
the stack after seeing the result, and Sullivan, Timmermann and White (2001) showed that no
calendar rule survives being judged against every rule that could have been tried. The
mine (below) charges each condition in bits for the same reason.

## Catalog (v1)

Every row is computable from the spine for the full window unless a floor is noted. Floors
and sources come from the research reports; a row marked [research] waits on them.

### Schedules

Exactly one. Each names dates; non-trading dates roll forward.

| group | schedules | notes |
| --- | --- | --- |
| Every | every trading day / every [weekday] | weekday 1–5; the default schedule is every Monday? No: the default is every trading day, which is plain DCA, so the empty strategy's edge is 0 and the board is flat until a word changes. See Open questions, 4 |
| Monthly | the [N]th of the month (1–28, last) / the [first…fourth, last] [weekday] of the month / the first or last trading day of the month / payday (the 1st and 15th) / monthly options expiration (the third Friday) | "the third Thursday" is `nth:3:4`. Options expiration moves to Thursday when the Friday is a holiday; the calendar carries it |
| Quarterly and yearly | the first or last trading day of the quarter / of the year / quad witching (the third Friday of Mar, Jun, Sep, Dec) / tax day (Apr 15, rolled) / [a fixed date] | a fixed date is a `MM-DD` parameter; the menu offers a few (Jan 2, Black Friday, Dec 24, Oct 19) and the URL takes any |
| Events | Fed decision day / jobs report / CPI / GDP advance estimate / the security's earnings day / the security's ex-dividend day / election day / inauguration day / Jackson Hole (the Fed chair's speech) | each with an offset word: the day before, the day of (default), the day after, the week after. "Day of" for a two-day Fed meeting is the decision day, 2 pm ET, inside the session. Floors per event in the event-calendars report (earnings ~2003 via EDGAR; the rest 1990 or earlier) [research] |
| Sky | full moon / new moon / the day Mercury turns retrograde | moon instants by Meeus ch. 49, Streak King's `moon.ts`; a full moon when the instant falls within 24 h of 00:00 UTC after the buy date, Streak King's werewolf-game rule. Mercury from a published table [research] |
| Odd | Friday the 13th / the Monday after the Super Bowl / the day before a market holiday / the first trading day after one / the Monday after a daylight-saving change / Groundhog Day | computable from the calendar; Super Bowl dates are a small ruling file; the DST rule changed in 1987 and 2007 |

### Conditions

Up to four, all must hold. A condition that reads a series takes a **reference**: the
security itself (default), the S&P 500, the VIX, any security or sector in the universe, or
a macro series. "Only after the S&P 500 fell 2%" and "only after this stock fell 2%" are
the same condition with two references. Groups marked exclusive offer a swap, not a stack.

| group | conditions | reference | notes |
| --- | --- | --- | --- |
| Move | fell at least [1, 2, 3, 5, 10]% over [a day, a week, a month, a quarter, a year] / rose at least the same | any series | the lookback is in trading days (1, 5, 21, 63, 252). Exclusive with itself per reference |
| Drawdown | [5, 10, 20, 30]% or more below its all-time high / below its 52-week high / at an all-time high (within 0.5%) / at a 52-week low | any price series | "below its all-time high" is the buy-the-dip family. The all-time high is the series' own since its first close, so a 1993 ETF's "all-time" is 1993+ and the sentence says so |
| Trend | above / below its [50, 200]-day average / golden cross in effect / death cross in effect / [3, 5, 10] down days in a row / up days in a row | any price series | a cross "in effect" is the state (50 over 200), not the crossing day; the crossing day is `event:cross` [v2] |
| Volatility | VIX above / below [15, 20, 25, 30, 40] / VIX rose [10, 20]% in a day | VIX only | CBOE VIX daily from 1990-01-02 [research], which is why the window opens there |
| Rates | fed funds rising / falling (the direction of the last target change) / yield curve inverted (10y below 2y) / 10-year yield above / below [X]% / Fed day with a hike / a cut / a hold | FRED | "Fed day with a cut" reads the 2 pm decision and buys the close; it is knowable in-session. Target history `DFEDTAR`, `DFEDTARU`/`L` [research] |
| Economy | unemployment rose / fell in the latest report / inflation (CPI, year over year) above / below [2, 3, 4, 5]% / the latest jobs report beat / missed consensus | BLS via FRED and ALFRED | **as first published** (ALFRED vintages), not revised; consensus needs a source and may be cut [research] |
| Sentiment | AAII bulls below [25, 30]% / bears above [40, 50]% / consumer sentiment (Michigan) below [X] | AAII weekly 1987, UMich monthly | AAII's terms need checking before it ships [research] |
| Season | in [month] / Nov–Apr / May–Oct / the first or last week of the month / options-expiration week / earnings season (the six weeks after a quarter ends) / year [1–4] of the presidential term / a Democrat / a Republican in the White House / the [N] trading days before an election | calendar | months exclusive; the two halves exclusive; the two parties exclusive |
| Sky | within a day of a full moon / a new moon / moon waxing / waning / Mercury retrograde | computed | the schedule "every full moon" buys on the moon; the condition "under a full moon" filters another schedule ("every Monday under a full moon") |
| Streak | the market fell [N] days in a row = Trend's down days; after the year's worst day so far | self or S&P | "the year's worst day so far" is knowable at the close and a cute cousin of a streak |

Cut from v1 after research, to confirm against the price and event reports: recessions
(dated after the fact), Fear & Greed (no history before 2011 and no license), intraday
prices (nothing free before 2000 and every schedule here is a close), short interest and
fund flows (paid), weather (Hirshleifer & Shumway's sunshine effect needs New York daily
weather and is disputed; v2 if ever), analyst ratings (paid, and survivorship), Google
Trends (2004+, sampled, unstable), consensus estimates (paid; "beat / missed" goes with
them). Daylight-saving Mondays and the day before a market holiday stay in as Odd
schedules: the calendar is already there and the literature says both are null since 1990,
which makes them safe to ship.

### Securities (the board's rows)

The universe is a hand-kept list like the sibling site's `universe.mjs`, each with its own
first close, grouped in the picker:

- **Indices**: the S&P 500 total return (`^SP500TR`, 1988), the S&P 500 price index, the
  Dow, the Nasdaq Composite, the Russell 2000, the Wilshire 5000 (FRED), with the
  price-data report settling which carry dividends and from when [research].
- **The pre-ETF total-return spine**: Vanguard index mutual funds with daily adjusted closes
  back decades: VFINX (the 500, 1976), VTSMX (total market, 1992), VEXMX (extended market,
  1987), VBMFX (total bond, 1986), VGTSX (total international, 1996), VEIEX (emerging,
  1994), VGSIX (REIT, 1996), VWELX (Wellington, 1929). These are how "$100 a week since
  1990 with dividends" is honest; SPY begins 1993-01-29.
- **ETFs**: SPY, DIA, QQQ, IWM, VTI, the nine original Select Sector SPDRs (1998-12-16) plus
  XLRE and XLC, TLT, AGG, BND, GLD, SLV, USO, EFA, EEM, VNQ, VXUS, ARKK, with their dates.
- **Sectors before 1998**: Kenneth French's 12 industry portfolios, daily from 1926,
  value-weighted, shown as "the tech industry (Fama-French), since 1990" so nobody reads
  them as a fund [research on terms].
- **Stocks**: the S&P 100 and Nasdaq 100 members from the sibling universe, each from its
  first close. Method says plainly that these are today's winners, so a "buy every stock
  here since 1990" reading is survivorship, and the indices and funds are the fair rows.
- **Other**: Bitcoin (Yahoo's `BTC-USD` from 2014; earlier needs a source [research]),
  gold spot (LBMA via FRED, 1968), oil (WTI via FRED), the dollar index.

The board's default load must stay under about 1.5 MB gzipped (Payload). If the whole
universe doesn't fit, the board loads a core set (indices, funds, ETFs, Dow 30 and the
mega caps) and the rest join the board when picked, like Streak King's crowns files.

## The menu's deltas

Streak King's `kings.ts` evaluates, for each chip the "+" menu offers, the definition that
adding it would make, and the menu shows that definition's king. Here `deltas.ts` does the
same with results: for every option the open menu offers (every schedule, every condition,
every choice of a condition already in the strategy, every reference), the strategy with
that option added or swapped is evaluated for the open security, and the item shows the
change in edge against the current strategy: "+3.1" in cream, "−1.4" in rust (rust is data,
and a worse result is the losing square), "no buys" faint when the stack empties the
schedule. The security picker shows each security's edge under the current strategy, since
dollars don't compare across securities, with an "edge first" sort word.

Costs. A per-day bitmask per (condition, reference, parameter) is built on first use over
the trading-day index (~9,100 days = 285 words) and cached for the session; a strategy is
the AND of its masks with the schedule's mask, then one forward pass accruing cash, buying
and marking to market. One evaluation is under 0.1 ms. A "+" menu of ~120 schedules and
~60 plain conditions is ~180 evaluations; a condition's own menu evaluates 5 thresholds × 5
lookbacks × a handful of references, ~100 more. The menu opens under 50 ms with no
precompute, the same economics that let Streak King drop its presets once the menu showed
the kings. The security picker's 300 evaluations run when it opens.

## Pages

Every page is Streak King's anatomy: dateline and icon bar, h1, the sentence, one footnote,
the board, the panel inline, What to read next, the citing ask and Ko-fi, Method, footer,
comments. Each address below says what its share card draws; the worker's card function
is exhaustive over page kinds (a `never` check) so a new page fails the typecheck until it
draws one.

### The board, `/`

The sentence: "[$100 a week] invested [every Monday] [only after the S&P 500 fell 2% in a
day] [+], since [1990]". Pickers on the budget, the schedule, each condition, the window;
"+" opens the grouped condition menu with its deltas; the budget menu holds the amount, the
fixed-per-buy word and the cash word. The footnote is the result for the open security and
the luck line: "Into SPY: 443 buys, $112,400 against $110,100 plain (2.1% ahead); among
1,000 random 443-buy schedules this beat 61%."

The board ranks every loaded security by the strategy's edge for it, the comparator's row
shape: rank, the security's mark (the ticker set in Graduate; there are no logos to
license), the Graduate number (the edge, rust when behind), mono small print (ending value,
buys, "since 1998" when floored), a 120-px sparkline of the strategy's value over plain
DCA's. Rows page with "see 25 more · N left"; nothing is cut. The security the sentence was
opened for (`?t=`) is the open row. On phones the board is the row list, not a rail.

Default state: every trading day, no conditions, since 1990, $100 a week into cash at the
T-bill rate. Its edge is 0 for every security, which is a flat board, so the prerendered
root is the first named page instead (Open questions, 4). Card: the top rows under the
sentence, drawn from the same engine (`share/og.png?<definition>`).

### The panel (a security's row, open)

The claim in plain English: "Buying SPY every Monday after a 2% drop in the S&P 500,
$100 a week since 1993, ended at $112,400: 2.1% ahead of plain DCA, 3% behind putting each
year's money in on day one." A stat strip: ending value, contributed, IRR, worst drawdown,
average cost against plain DCA's, buys, average cash. The windows line and the decades
strip. A cumulative SVG of the strategy, plain DCA, the year's-money-on-day-one line and
cash (the comparator's curve; Schwab's four investors on one chart). The ledger: the last eight buys (date, price, shares, what
the lot is worth now), the **next buy day** on top as a row of the same design with a rust
dashed rule (the next third Thursday, the next Fed decision, the next full moon), a link to
the security page, share and close. Deep link `?t=spy`.

### The by-security board, `/?for=spy`

Streak King's "as [team]" axis. With a security fixed, the rows are strategies: every
schedule the menu offers under the current conditions, then every single condition added
to the current schedule, ranked by edge. It answers "what is the best day of the week to
buy SPY" in one list, and it is the same numbers the menu shows, grouped. `for` and `t`
never meet. Card: the top strategies for the security.

### Security pages, `/security/<ticker>/`

Prerendered per security with its own card. The h1 is the security beside its mark and is
a picker for any other; mono meta (first close, last close, the fund or company name).
"$100 a week since 1993" as the plain story: ending value, contributed, IRR, the curve.
"What works for SPY": the strategies it leads (the mine's placings, One floor), each a row
that opens the board under that strategy with SPY open, sub-strategies grouped under their shorter telling. "Best day
to buy": three short strips, weekdays, days of the month and events, each option's edge as
a bar. "Upcoming buy days": its next earnings, ex-dividend, the next Fed decision and jobs
report, the next full moon. `<title>`: "Best day of the week to buy SPY, and every other
schedule since 1993 · <site>".

### Named pages (search)

Streak King's `landing.ts`: about twenty prerendered addresses, each the question people
type as the h1, the answer in a sentence with the names in it, an ItemList, a sitemap entry
and a line in `llms.txt`. Candidates, each a definition the board already computes:
"Best day of the week to buy the S&P 500", "Does buying on a full moon beat dollar-cost
averaging?", "Buying the day after Fed meetings since 1990", "Buying the dip: only after a
5% drop", "Sell in May: buying only November to April", "Buying on options expiration
day", "Buying on the first of the month vs the 15th", "Buying on jobs report day", "Buying
only when the VIX is above 30", "Buying under a death cross", "Election day buying since
1992", "Friday the 13th". The prior-art report's anomaly list is the long tail. Card: the
board's card under that definition.

### The calendar, `/calendar/`

The schedule page's cousin. The coming month: each trading day with its events (Fed
decision, jobs report, CPI, earnings in the universe, ex-dividends, full moon, options
expiration, holidays) and the named strategies that buy that day. Past weeks: what each
named strategy bought and at what close, the "streaks broken" digest's shape. A year
picker back to 1990 opens any week. Card: the week's calendar.

### Posts

Weekly, in Harper's Index form, written or heavily edited by Drew: what the named
strategies bought, the buy that aged best and worst this year, a famous rule that flipped.
The clock is the first Friday (the jobs report) or the Fed week. `content/posts/` as Streak
King.

## URL state

`url.ts` pure, one param a slot, defaults omitted, readable keys in Streak King's
`chip:choice` style:

```
?s=weekday:1                  every Monday
?s=nth:3:4                    the third Thursday
?s=event:fomc:+1              the day after a Fed decision
?s=moon:full
?c=move:spx:-2:1d,vix:gt:25   fell 2% in a day (S&P 500) and VIX above 25
?c=below:self:ma200
?b=100w                       $100 a week   ?amt=fixed   ?cash=0
?from=2000                    window start
?t=spy                        the open security      ?for=spy   the by-security board
```

A definition change is `replaceState`; opening a row or a page is `pushState`. Retired
params are nulled on every write. Round-trip tests for every chip and choice, as Streak
King's `url.test`.

## Data pipeline

Streak King's shape: raw caches gitignored, rulings in `data/ref/*.json` with receipts,
`build-payload` writes `src/data` behind known-answer gates, `build-current` refreshes in
CI, one engine. The sources and floors are the research reports' findings; this section
names the pieces and the rules, and the reports carry the URLs and terms.

1. **Prices.** `yahoo-finance2` daily adjusted closes with `events: 'div,splits'` for the
   universe, as the sibling site does today in CI, cached under `data/raw/yahoo/`. Each
   series' first close is recorded as its floor. A series the fetch drops for a day it
   should have (SPY on a non-holiday weekday) fails the build: a degraded payload is a bug.
   Cross-check a sample against a second source (Stooq) in `coverage-report.mjs`.
   [research: terms, reliability, delisted tickers]
2. **Indices and macro.** FRED's API with the free key (`DTB3`, `VIXCLS`, `DGS10`, `DGS2`,
   `DFF`, `DFEDTAR*`, `UNRATE`, `CPIAUCSL`, `PAYEMS`, `WILL5000*`, gold, oil, the dollar).
   **Vintages**: `UNRATE` and `CPIAUCSL` are read from ALFRED as first published, so a
   condition sees the number the day's buyer saw; the revised series stays for the chart.
   The CBOE's own VIX history file for 1990–2003 if FRED's `VIXCLS` starts later [research].
3. **Sectors.** Kenneth French's daily 12-industry portfolios, fetched and checksummed,
   value-weighted, under his terms [research].
4. **Event calendars**, each a `data/ref/<event>.json` of dates with receipts (`{ url,
   quote }`, checked by `check-receipts.mjs` against committed page copies): FOMC decisions
   from the Fed's historical-materials pages, 1990→ (and the unscheduled moves of 2001,
   2008, 2020 as their own flag); BLS Employment Situation and CPI release dates from the
   schedule archives, with the shutdown delays of 1995–96, 2013, 2018–19 and 2025; BEA
   GDP advance dates; election and inauguration days by rule with a ruling file for the
   oddities; Jackson Hole; Super Bowl Sundays. [research: how far back each archive goes]
5. **Earnings.** EDGAR's submissions API per CIK (fair access: 10 requests a second, a
   `User-Agent`), 8-K filings with Item 2.02 from 2003-03. Before- or after-market is not
   in the filing, so "earnings day" is the first session that trades on it: a filing
   stamped after 4 pm ET maps to the next session [research: whether the acceptance time
   suffices; a floor year]. Ex-dividend dates from the Yahoo events.
6. **The moon.** `moon.ts` from Streak King (Meeus, within ~2 min of NASA's instants),
   phases for every day in the window; Mercury retrograde from a published table with a
   receipt [research].
7. **The calendar.** NYSE trading days 1990→ as a committed table with receipts, built once
   and cross-checked against `exchange_calendars` [research: license]; the running year
   from the NYSE's published holidays.
8. **Refresh.** CI runs `build-current` weekdays after the close (about 22:30 ET) and a full
   refetch on Sundays; the push build uses committed data. The dateline shows the data's
   date. A new FOMC year, BLS schedule or holiday list is a yearly ruling-file update the
   coverage report nags about in December.

Rulings expected: fund-to-ETF successors (none in v1; each row is its own series), split
and dividend corrections where Yahoo's adjustments are wrong (a `price-corrections.json`
layered at parse, fail-loud when stale), the Super Bowl and Jackson Hole dates, and the
fixed-date schedules' holiday rolls.

## Payload and compute

Trading days are one shared index (~9,100 dates since 1990, `core.json`). Every series is
closes against that index, each close × 1,000 as an integer, delta-encoded as varints, so
the stored price is exact and a day's delta is one or two bytes (an estimate of 15 KB
gzipped a series, to be measured; price deltas are close to noise and don't compress much
further). Log returns in Int16 were considered and rejected: a basis point of rounding a
day drifts about half a percent over 36 years, which is the size of the edges the board
ranks. `core.json` carries the index, the S&P 500, the VIX, the macro and rate series,
every event calendar and the moon phases, about 250 KB gzipped. The board needs every
row's series, so the universe size is the load: 100 series is ~1.5 MB, 300 is ~4.5 MB. The decision rule is a measured production
build under 1.5 MB before first paint (Streak King's "is a browser going to fetch 84 MB"
question), which puts ~100 series on the board by default and the rest behind the picker,
each a `series/<id>.json` fetched when chosen. Open questions, 5.

The engine is one module with no React: `masks.ts` (per-day bitmasks per condition and
reference, lazily built and cached), `evaluate.ts` (the AND, the forward pass, the
results), `luck.ts` (the bootstrap, in a worker), `deltas.ts` (the menu). It runs the same
in the client, in `prerender.mjs`, in the mine and in the share worker.

## The mine: what every security leads

Streak King mines every team's run under every definition at build so a team page can say
what it leads without the browser walking the space. Here `mine.mjs` evaluates, per
security, every schedule the menu offers (~120) under every stack of up to three plain
conditions at canonical thresholds (~60 conditions → ~36k stacks) and records each
result's edge and buys. That is ~4.3M strategies a security, ~430M for a hundred, at
~9,100 steps each: ~4×10¹² steps, far past a CI runner. Two prunings make it tractable,
both monotone like Streak King's floors: an AND only shrinks the buy set, so a stack whose
buys fall under the floor (24 buys, about two a year) is dropped with its subtree, and a
condition that leaves fewer than 5% of the schedule's days is near-degenerate and stops
the walk there. Streak King's walk survived 1.03M of 23M definitions this way. Measure one
security's cost first and pick the condition list from the measurement (Open questions,
7). Workers on one thread a core as `mineWorker.js`.

A **placing** is a (security, strategy, edge, buys, rank in the field of securities). The
list rule is Streak King's one floor: a security's page lists the strategies under which it
leads the field (rank 1, ties included), no score floor, every list paging with "see more".
The order is a score in bits that is never shown: the luck percentile as `−log2(1 − p)`
less each condition's cost (plain 3, parameterized 3 + log2 of its choices, as the crown
score charges "vs Tennessee" for being one of 288), so a four-word stack must beat blind
timing by more than a plain one to rank above it. A sub-strategy, one whose conditions are a strict superset of a shorter telling's that does at least as well,
is grouped under that telling behind "show N sub-strategies", Streak King's `markDups`. Named pages and security pages read `dist/mine/<id>.json`; the board never does.

## Honesty, in Method

The page says less, Method says all of it: the universe is today's securities, so the stock
rows carry survivorship and the index and fund rows are the fair ones; dividends reinvest
on the ex-date through the adjusted close, which overstates by the days to the pay date;
cash earns the 3-month bill and a word turns that off; no fees, taxes or spreads; the
macro conditions use first-published numbers; a condition's floor is in the sentence; the
luck line and the bits cost exist because a reader who tries a hundred strategies will
find one that wins, and that one is probably noise; every published number a gate checks
is named with its source, and where our number differs (Portfolio Visualizer's monthly
compounding, a publisher's dividend treatment) the difference is explained there, never
patched in the data.

## Known-answer gates

The build fails before writing the payload on any of these, and `golden.test.ts` asserts
them again through the client's code path. The quotable ones come from the prior-art
report, whose numbers are from search extracts and need checking against the primary
sources before they become gates (the sandbox that wrote the report could not open the
pages); a gate names its source and period, and a mismatch is explained in Method, never
patched. The structural ones first:

- Plain DCA on every trading day equals the sum of the daily buys marked to the last close,
  to the cent; a strategy's ending value equals its shares × the last close plus cash.
- The lump sum into `^SP500TR` reproduces the index's published total return over the
  window within rounding; VFINX's $100 a month since 1990 matches Portfolio Visualizer's
  ending value within the monthly-versus-daily compounding difference, explained.
- The by-security board's row for SPY under a strategy equals the board's SPY row under
  it, and both equal the panel: numbers nest.
- Every schedule buys the expected count: "every Monday since 1990" is the number of
  Mondays the NYSE was open; "every full moon" ~443; "the third Friday" the count of
  months; "Fed decision day" the FOMC table's count.
Then the famous numbers, each reproduced on the site's own series over the source's period
where the series reaches it, and otherwise over the overlap with the direction checked:

- The windfall lump sum beats 12-month DCA in about two thirds of rolling ten-year windows
  (Vanguard 2012: 67% US, 60/40, 1926–2011; 68% on MSCI World 1976–2022 in the 2023 note).
  Our series start in 1990, so the gate is the 1990→ overlap, direction and rough rate.
- Buying the dip with perfect foresight loses to monthly DCA in more than 70% of 40-year
  windows, 97% when the bottom is missed by two months (Maggiulli 2019); a 10–20% dip
  threshold beats DCA about one time in four over 20-year windows (Maggiulli 2021). The
  "below its all-time high" condition and the cash accounting must reproduce the asymmetry.
- Schwab's five investors, $2,000 a year 2003–2022: perfect timing $138,044, day one
  $127,506, monthly DCA $124,248, the worst day of each year still about three times cash.
  The period is inside ours and the year's-money-on-day-one benchmark is Ashley exactly.
- Missing the ten best days roughly halves twenty-year wealth, and seven of the ten best
  days fall within two weeks of the ten worst (J.P. Morgan Guide to Retirement 2023–24;
  Estrada 2008 for the critique). A data-integrity gate on the daily total-return series,
  and the "best days live in bear markets" fact (Hartford/Ned Davis: about 78%) pairs with
  the VIX condition.
- Turn of the month: the last and first three trading days carry the market's return
  (Lakonishok & Smidt 1988; McConnell & Xu 2008, 0.15% a day value-weighted 1926–2005).
- Sell in May: November–April beats May–October (Bouman & Jacobsen 2002; Zhang & Jacobsen
  2021, about 6 points a year over 50 years). The Almanac's Dow figures are price-only, so a
  total-return reproduction differs and the gate says by how much.
- The pre-FOMC drift: about 49 basis points a meeting 1994–2011 (Lucca & Moench 2015) and
  gone after 2015 (Kurov, Wolfe & Gilbert 2021). Checks the FOMC table and the decades strip.
- The Santa Claus rally: the last five trading days of December and the first two of
  January, about +1.3%, positive about 79% of years since 1950 (Hirsch).
- Friday the 13th: no effect (Dyl & Maberly 1988; Lucey 2000). A deliberately null gate.
- The full moon: new-moon-window returns about double full-moon-window returns over a
  century (Dichev & Janes 2003) and weak since 1990 (CXO). The werewolf schedule should land
  near zero edge, and the gate is the direction, not the size.
- The S&P 500 total return since 1990, about 10–11% a year depending on the end date, computed
  from our series and checked against a published figure for one fixed end date.

## Analytics

The index site's embed. Events: `definition` (the strategy on every change, with its
words), `security open`, `security page`, `for board`, `menu deltas` (which menu, how many
options, the top delta), `calendar`, `calendar week`, `show more`, `share`, `kofi`, and
`luck` when the footnote renders a percentile. The whole point is learning which strategies
people build, as Streak King tracks chip combinations.

## Build order

Each chunk in the executive-summary shape: what it is, what dropping it costs, the cheap
version.

1. **Engine, core data and the board.** `core.json` (trading days, the S&P 500 TR, the
   VIX, the FRED series, the moon, the rule-based calendars), the Vanguard funds and the
   ETFs, `evaluate.ts`, the sentence with every schedule and condition the core data
   supports, the deltas menu, the board, the panel, the luck line, URL state, prerender of
   the root. Drop it and nothing exists. The cheap version is the whole site at its
   smallest: no events needing research, no stocks, no mine. It already answers "best
   weekday", "full moon", "buy the dip" and "sell in May" for the indices and funds.
2. **Event calendars.** FOMC, BLS, BEA, elections, Jackson Hole as receipt-backed ruling
   files; the Events schedule group; the calendar page. Drop it and the Fed-day, jobs-day
   and election strategies the brief names don't exist. Cheap version: FOMC and BLS only.
3. **Securities and their pages.** The stock universe as on-demand series, security pages
   with the plain story and the three "best day" strips (computed in the browser, no mine),
   the by-security board. Drop it and the site is indices and funds, which is defensible.
4. **Earnings.** EDGAR 8-K Item 2.02 per CIK, the reaction-day rule, the earnings schedule
   and the "earnings season" condition. Floor 2003. Drop it and no per-stock event schedule
   exists; the stock rows still work on every other schedule.
5. **The mine, named pages, search.** `mine.mjs`, placings, "what works for X", the twenty
   named pages, ItemList JSON-LD, sitemap, `llms.txt`, IndexNow on changed URLs. Drop it
   and security pages compute their strips live and nothing is prerendered for search but
   the root; the site works and nobody finds it.
6. **Worker, cards, index card, posts.** The share worker on `drewhoover.com/<slug>/*`,
   `og.png` and `card.png` from real rows, per-page cards, the sports-nav-style sibling
   list (this site is not a sports site; see Open questions, 1), the index-site card PR,
   the first post.

1 first; 2 and 3 in parallel after it; 4 after 3; 5 after 2 and 3; 6 last. Incremental
adoption starts after 1: the site is shareable the day the board renders.

## Out of scope for v1

- Selling rules, rebalancing, portfolios of several securities, withdrawals. One security,
  buys only.
- Intraday fills (opens, VWAP); every buy is a close.
- Taxes, fees, spreads, whole shares.
- Leverage and short positions.
- Options data, short interest, fund flows, analyst estimates (paid).
- "Tilt" strategies: a base schedule plus extra money on condition days ("every Monday,
  and twice as much when the VIX is above 25"). A real idea with its own budget semantics;
  a v2 word in the budget menu.
- A crossing-day event schedule ("the day of a golden cross") and a drawdown-recovery
  schedule ("the day it regains its high"): events computed from a series rather than a
  calendar. v2.
- Non-US markets and currencies.

## Open questions

1. **Name.** Internal name `dca-strategy-builder` (plain, descriptive) until a user-facing
   name is chosen. Candidates for the evocative one, which goes on the page and the index
   card only once chosen: "Buy Day", "Pay Day", "Cost Average", "Timing King" (the sibling
   read), "Dip King", "Full Moon Fund". The site is not a sports site: it goes on
   `/projects` as a card, not `/sports`, and What to read next lists the sibling finance
   sites (should-you-buy-an-all-time-high, boring-returns, buy-it-now-or-never) rather
   than the sports list. WDYT?
2. **Budget model.** My lean: accrual into cash at the T-bill rate by default, fixed-per-buy
   as a word. Accrual is the only model where "wait for a 10% drop" and "every day" are
   compared on the same dollars; fixed-per-buy is what most backtesters do and what people
   expect "DCA $100 every Monday" to mean. Keeping both costs one word and a second results
   shape (IRR instead of dollars). Fine?
3. **Same-day close.** Conditions read the buy day's close and buy at it. The alternative,
   reading the prior close, makes "the day the S&P fell 2%" buy the next day, which isn't
   what anyone means by it. The cost is a small optimism on daily-move conditions (a
   market-on-close order can be placed with a 2% move visible, but not at 3:59:59). Lean:
   same day, with "the day after" offsets available on every event. OK?
4. **The default state and the root page.** The empty strategy is plain DCA and its board
   is flat (every edge 0). Options: the root prerenders a named definition (every Monday,
   the way Streak King's bare URL opens "vs unranked"); or the root opens the by-security
   board for the S&P 500 (every schedule ranked); or the default schedule is every Monday.
   Lean: the root is "every Monday" with the S&P 500 open, which shows a real board and a
   sentence a reader can change.
5. **Board universe versus payload.** Exact varint closes for ~100 series is ~1.5 MB gzipped;
   300 is ~4.5 MB. Lean: ~100 series on the board by default (indices, funds, ETFs, the Dow
   30 and the mega caps), the rest fetched when picked. Or quantize harder (weekly closes
   for the board's sparklines, daily only for the open row), which complicates one engine.
6. **Earnings.** Floor 2003 from EDGAR 8-K Item 2.02; the acceptance timestamp decides the
   reaction session. If the timestamp is unreliable, the schedule offers "the day of the
   filing" and "the day after" and says which it is. Alpha Vantage's free earnings
   endpoint reports dates back further; its terms decide [research]. Which floor is honest
   enough to ship?
7. **The mine's size.** Measure one security first. If three conditions at canonical
   thresholds is too slow on a runner, the mine runs on the Mac and commits its output, as
   the NBA history spine does; or it mines two conditions in CI and three offline.
8. **Vintages.** First-published unemployment and CPI from ALFRED is right and costs a
   second fetch path and a Method paragraph; revised values are wrong by a tenth here and
   there and cost nothing. Lean: ALFRED for the two series conditions read, revised for
   the charts.
9. **Sectors before 1998.** Fama-French industries as rows, labeled as such, or sectors
   start in 1998 with the SPDRs and the sentence says so. Lean: both, the industries as
   their own group so a reader can't mistake one for a fund.
10. **The luck line's method.** Random schedules with the same buy count over the same
    window is the plainest null. A stricter null keeps the schedule and shuffles the
    conditions' days, which tests the condition rather than the timing. One method on the
    page, the other behind a dev flag until the numbers are understood.
11. **Four conditions.** The UI cost of four is nothing, the space is already past
    counting (below), and the bits cost keeps the four-word stacks honest on the lists.
    Fine?

### How big the space is

Streak King's mined space is 23M definitions over 443 chips. Here the menu's schedules
(~120 with offsets and fixed dates) × conditions (each kind with its thresholds,
lookbacks and ~20 references is about 2,000 distinct single conditions; stacks of up to
four are about 6.6×10¹¹) × ~300 securities × 5 window starts × 2 budget models is about
2×10¹⁷ strategies, well past the 160 billion streak definitions Drew counted. The menu
never walks it (it evaluates one neighborhood), the mine walks a pruned plain subset, and
Method says the number once because readers like it.
