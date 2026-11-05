# Price and macro data sources for the DCA backtester

Research notes, 2026-11-05. Scope: daily US equity/ETF prices with total return back to ~1990, long-history indexes, sector proxies, FRED macro series for conditions, dividend/split events, and the NYSE trading calendar. Target: a static GitHub Pages site whose build script (GitHub Action, weekdays after the close) fetches data and commits compact JSON.

## How to read the verification marks

- `[v]` -- I read the page itself this session (GitHub, raw.githubusercontent.com, PyPI, npm registry were the only hosts reachable from the sandbox; everything else returned a proxy 403).
- `[s]` -- a web-search result quoted the page's own text, but I could not open the page. Treat as "probably right, check before relying on it".
- unmarked -- from memory. Needs checking.

Quoted license/terms language is given verbatim where I had it. Where I only had a paraphrase I say so. Hosts that need to be opened to finish verification: finance.yahoo.com / legal.yahoo.com, stooq.com, fred.stlouisfed.org (+ api., alfred.), mba.tuck.dartmouth.edu, shillerdata.com, aaii.com, cboe.com / cdn.cboe.com, kaggle.com, tiingo.com, alphavantage.co, eodhd.com, polygon.io (now massive.com), twelvedata.com, financialmodelingprep.com, marketstack.com, data.nasdaq.com, bls.gov, nyse.com.

---

## 1. Daily US equity and ETF price history back to 1990

### 1a. Yahoo Finance via `yahoo-finance2` (the incumbent)

| Item | Finding |
|---|---|
| Package | `yahoo-finance2` on npm. `latest` = 4.0.5, last modified 2026-10-21, license MIT `[v]` (npm registry). Repo renamed to `gadicc/yahoo-finance2`; branches `master`->`main`, `devel`->`dev` `[v]`. Runtimes: Node 22+, Bun, Deno 2+, Cloudflare Workers `[v]`. |
| Right module | `chart()` is "the primary" source for price, volume and event data `[v]` (`src/modules/chart.ts`). `historical()` is deprecated and internally mapped onto `chart()`; the "ripHistorical" notice can be suppressed with `suppressNotices: ["ripHistorical"]` `[s]` (deepwiki summary of the notices subsystem; the README itself still lists `historical` as a module without a deprecation flag `[v]`). |
| Options | `period1` (required), `period2`, `interval` (`1d`, `1wk`, `1mo`, ...), `includePrePost`, `events` (default `"div|split|earn"`), `return: "array" | "object"` `[v]`. |
| Result | `quotes[]` of `{date, open, high, low, close, volume, adjclose?}`; `events.dividends[]` of `{amount, date}`; `events.splits[]` of `{date, numerator, denominator, splitRatio}`; `meta.firstTradeDate` `[v]`. `adjclose` is optional and "Missing in e.g. 'APS.AX'" `[v]`. |
| Depth | "Daily and longer intervals have extensive history" `[v]`. ^GSPC goes back to 1927-12-30 and ^IXIC to 1971-02-05 (memory). The chart endpoint returns full-precision floats; the old CSV download rounded Adj Close to 2 decimals, which was a known accuracy problem for low adjusted prices decades back `[s]` (r-sig-finance). |
| Adjusted close method | Yahoo's help page says it applies split and dividend multipliers "adhering to Center for Research in Security Prices (CRSP) standards" and adjusts dates before the ex-date `[s]`. Factor per dividend = 1 - D / close(ex-date minus 1) `[s]` (AmiBroker forum; algebraically the CRSP convention). Known defects: missing dividends (SHY 2007 example in arXiv 1105.2956) `[s]`, mutual fund capital-gains distributions sometimes not adjusted `[s]`, adjclose rewrites the entire history at every new ex-date `[s]`. |
| Delisted tickers | README: "If a stock gets delisted, a query that worked previously ... will begin to throw an error. This includes historical (and chart) data from _before_ the delisting occurred. This is how Yahoo treats delisted stocks and there is nothing we can do about it." `[v]` So Yahoo is strictly survivor-only. |
| Terms of use | README: "This project is neither created nor endorsed by Yahoo Inc. ... we make no guarantees and you use this package at your own risk" and Yahoo "offers no guarantees of service availability or API consistency" `[v]`. Yahoo's own ToS (US version at legal.yahoo.com/us/en/yahoo/terms/otos/) was unreachable. A 2025 Ireland version bars use of gathering or extraction tools "for any purpose without our express, prior permission" `[s]` (fragmentary snippet). Yahoo's API terms are described second-hand as prohibiting automated collection by means other than Yahoo APIs `[s]`. Net: there is no license to redistribute Yahoo-sourced closes; the existing site already accepts this posture. Committing the JSON to a public repo is redistribution. |
| Rate limits / CI reliability | No published limit. Failure modes seen in the tracker: "Invalid Crumb" (issue #764, opened 2024-04-15, closed; fixed by cookie/crumb handling in 2.11.3 and later "use getcrumb endpoint" fix 2025-08-15) `[v]`; crumb fetch returning HTTP 429 with the literal crumb value `Too+Many+Requests` `[s]` (yfinance #2441); IP-based blocks lasting >24h reported `[s]`; a commenter says the crumb request needs a browser-like `User-Agent` or it 429s `[s]` (issue #764 thread, via search). An issue search for "GitHub Actions" in the yahoo-finance2 tracker returned nothing relevant `[v]`, so there is no documented CI-specific block, but shared runner IPs are the obvious risk. Mitigations: fetch incrementally (period1 = last cached date), keep the committed JSON as the cache so a failed run leaves the site intact, retry with backoff, run once per weekday, keep ticker count small. |
| Browser use | "It's not possible to run this in the browser, due to CORS and cookie issues." `[v]` -- so fetching must stay in the Action, which matches the architecture. |

### 1b. Other sources

| Source | Free-tier depth / limits | Adjusted / events | Delisted | Terms | Key | Verdict |
|---|---|---|---|---|---|---|
| **Stooq** (`stooq.com/q/d/l/?s=spy.us&i=d`) | Daily CSV per symbol; ^SPX series back to 1789/1792 (spliced) `[s]` (EliteTrader), Dow back to at least 1900 `[s]`; low undocumented daily hit quota, returns "Exceeded the daily hits limit" `[s]` (Wealth-Lab wiki); bulk zips at `stooq.com/db/h/` `[s]`; an API directory claims a CAPTCHA-issued key is now required (early 2026) `[s]`, unconfirmed. One user reports Stooq data stopped updating 2026-03-24 `[s]`. | Prices are split-adjusted; US equities generally not dividend-adjusted (memory). No event feed. | No | `stooq.com/terms.html` unreachable. A university page paraphrases: "only allow use of this interface for non-commercial purposes" `[s]` (old). Needs direct reading. | None | Good as a long-index cross-check (^SPX, ^DJI); not a spine (quota, no TR, terms unclear). |
| **Tiingo** | Free: 50 req/hour, 1,000 req/day, 500 unique symbols/month, 1 GB/month `[s]` (multiple sources agree; pricing page unreachable). End-of-day history is deep (AAPL from 1980 in riingo README) `[s]`. | EOD rows carry `adjClose`, `divCash`, `splitFactor` per day `[s]` (docs snippet: "the dividend paid out on 'date'" / "the factor used to adjust prices when a company splits, reverse splits, or pays a distribution"). | Reported to include delisted stocks `[s]` (EliteTrader user); not confirmed by Tiingo docs. | Competitor comparison says Tiingo plans are "for internal use only. Redistribution needs a separate license" `[s]`. Needs the actual Tiingo license page. | Free key | Best free *structured* events source (per-day cash dividend + split factor) and plausibly delisted coverage. Redistribution clause is the blocker for committing data publicly. |
| **Alpha Vantage** | 25 requests/day on free keys `[s]` (alphavantage.co/premium snippet); 5/min `[s]`. `TIME_SERIES_DAILY` with `outputsize=full` = 20+ years raw (memory). | `TIME_SERIES_DAILY_ADJUSTED` is premium-only `[s]` (Coupler docs). | `LISTING_STATUS&state=delisted` lists names; price history for them is partial (memory). | Free for "verified open-source or educational projects" is mentioned `[s]`. Terms page unreachable. | Free key | 25/day cannot refresh 200 tickers. No. |
| **EODHD** | Free: 20 API calls/day, 1 year of history `[s]` (eodhd.com snippets). All World plan $19.99/mo, 100k calls/day `[s]`. | Yes (paid) | Yes: symbol list `delisted=1`; delisted tickers behave like active ones on EOD/dividends/splits; reused tickers get `_old` suffix `[s]` (EODHD docs). | Not read. | Free key | Free tier useless for history; the paid tier is the cheapest well-documented delisted coverage if the project ever pays. |
| **Polygon.io** (renamed **Massive**, api.polygon.io and api.massive.com both work `[s]`) | Basic: $0, 5 calls/min, 2 years of history, end-of-day `[s]`; a wrapper observed `NOT_AUTHORIZED` for dates older than ~2 years `[s]`. Dividends endpoint has `ex_dividend_date`, `pay_date`, `record_date` filters `[s]`. | Yes, but 2-year window | "We do not remove companies that have been delisted ... We store the market data exactly as it happened" `[s]` (support article); no ticker-reuse problem `[s]`. | Not read. | Free key | 2-year window kills it for a 1990 backtest. Useful only as a pay-date lookup for recent dividends. |
| **Nasdaq Data Link** | Anonymous 50 calls/day; free key 50,000/day, 300 per 10 s `[s]` (docs v1.0, may be stale). WIKI EOD prices were discontinued in 2018 (memory). MULTPL/SHILLER_PE stopped updating Jan 2024 `[s]`. LBMA/GOLD described as free `[s]` (undated). | n/a | Sharadar SEP (paid) has delisted | Per-dataset | Free key | No free US equity EOD survives. Only niche free series. |
| **Finnhub** | 60 calls/min `[s]`; `/stock/candle` returns `{"error":"You don't have access to this resource."}` on the free plan `[s]` (Finnhub-API issue #546). | n/a | ? | Not read | Free key | No. |
| **Twelve Data** | Basic: 8 credits/min, 800/day, "internal non-display usage only" `[s]` (pricing page text). 5,000 points per request `[s]`; history depth on Basic not stated. | Adjusted available (memory) | ? | "internal non-display usage only" on the free plan `[s]` -- incompatible with a public site. | Free key | No. |
| **Financial Modeling Prep** | 250 calls/day `[s]`; free plan history is "5 years" per FMP FAQ and help article `[s]`, though a third party attributes 5 years to the paid Starter plan `[s]`; 500 MB/30 days `[s]`. | Yes | Delisted Companies list is free `[s]` (FMP blog) | Not read | Free key | 5 years. No. |
| **marketstack** | 100 requests/month, 1 year history, EOD only, non-commercial `[s]`. | ? | ? | "non-commercial" `[s]` | Free key | No. |

### 1c. Survivorship bias

- Yahoo deletes delisted tickers entirely `[v]`. Stooq, Alpha Vantage (mostly), Nasdaq Data Link free, Twelve Data free: survivor-only or near it. Delisted coverage exists at Polygon/Massive `[s]` (but 2-year free window), EODHD paid `[s]`, Tiingo (reported) `[s]`, Sharadar (paid), Norgate (paid, the usual reference for survivorship-free US data; memory).
- Practical consequence: a user who picks a single stock is picking from today's survivors. Index and sector-ETF backtests do not suffer from this (the index itself handled the deaths). The UI should say so when a single ticker is chosen, and the spec should not promise "any stock since 1990" -- it should promise "any currently listed stock, from its first trade date or 1990, whichever is later".
- Ticker reuse is a second trap (a reused symbol silently points at a different company) -- EODHD's `_old` suffix and Polygon's no-reuse policy exist for this `[s]`.

### 1d. CC0 / public-domain daily dumps (Kaggle)

- "Huge Stock Market Dataset" (Boris Marjanovic): daily OHLCV for US stocks and ETFs on NYSE/NASDAQ/NYSE MKT, one CSV per ticker, ~8,539 files, data through 2017-11-10 `[s]`; a secondary analysis says prices are split- and dividend-adjusted `[s]`. License is CC0 from memory; the Kaggle page was unreachable, so confirm. Because it was frozen in 2017 it contains tickers that have since been delisted -- the only free US-equity file I know of with post-1990 non-survivors, but adjusted-only (no raw close, no event list) and nearly a decade stale.
- "Stock Market Dataset" (Oleh Onyshchak / jacksoncrow): all NASDAQ-listed tickers, pulled with yfinance, through 2020-04-01 (memory), CC0 (memory) `[s]` for the yfinance/NASDAQ description only.
- "S&P 500 stock data" (Cam Nugent): 2013-2018, CC0 (memory). Too short.
- Several Kaggle BTC-USD sets state CC0 `[s]`.
- None of these is a live source; at most they are a one-time seed for delisted names.

---

## 2. Broad indexes with long history

| Series | Source(s) | Start | Grain | Notes |
|---|---|---|---|---|
| S&P 500 price (^GSPC) | Yahoo chart | 1927-12-30 (memory; one R package says Yahoo returns from 1950 `[s]`) | daily | Price only. |
| S&P 500 total return (^SP500TR) | Yahoo chart | 1988-01-04 `[s]` (R `ustreasuries::SP500TR` doc: "Daily S&P 500 Total Return data from Jan 4, 1988 to present") | daily | The only free daily US large-cap TR index for 1988-1993. S&P's own TR history is also 1988 (memory). |
| S&P 500 on FRED (SP500) | FRED | rolling 10 years only `[s]` (FRED 2014 notice: "FRED and its associated services will include 10 years of daily history for Standard & Poors and Dow Jones Averages series"); notes say "Permission to reproduce this series can be requested from index_services@spdji.com" `[s]` | daily | Not usable for a 1990 backtest; and S&P's reproduction restriction applies. |
| Dow (^DJI) | Yahoo chart; Stooq ^dji | Yahoo: 1992-01-02 (memory; conflicting forum reports of 1985 and 1928 `[s]`) ; Stooq: ~1900 `[s]` | daily | Price only. |
| Nasdaq Composite (^IXIC) | Yahoo | 1971-02-05 (memory) | daily | Price only. |
| Russell 2000 (^RUT) | Yahoo | 1987-09-10 (memory) | daily | Price only; FTSE Russell TR not free. |
| Wilshire 5000 (WILL5000IND TR, WILL5000PR price, WILL5000INDFC full-cap TR) | FRED -- **removed** | Added to FRED with "observation ranges from 1970-12-31 to current" `[s]` (FRED news); "On June 3, 2024, FRED will remove all Wilshire Index data" from database, Excel add-in, apps and APIs; questions to index.access@wilshire.com `[s]` (news.research.stlouisfed.org/2024/04/...) | daily | Gone. Any copy you have is frozen at 2024-05-31. Wilshire Advisors re-acquired the 5000 after the index business was sold `[s]`. Not redistributable. |
| Shiller S&P data | shillerdata.com (ie_data.xls); old Yale URL econ.yale.edu/~shiller/data/ie_data.xls still referenced by many scripts `[s]` | 1871-01 | monthly | Price, dividend, earnings, CPI, long rate, CAPE. No explicit license on the page; datahub.io maintainer: "there is no exact statement on license of original data" `[s]`. Treat as "cite Shiller, do not claim a license". Monthly, so only for conditions (CAPE) and for a monthly pre-1988 TR reconstruction, not daily. |
| Fama-French market factor (Mkt-RF + RF) and industry portfolios | Ken French Data Library | 1926-07-01 (daily) (memory) | daily | **The free daily total-return series that exists before any ETF.** Value-weighted CRSP all-stock market return including dividends. Files: `F-F_Research_Data_Factors_daily_CSV.zip` `[s]` (FFdownload README lists it), `5_Industry_Portfolios_daily_CSV.zip`, `10_`, `12_`, `17_`, `30_`, `38_`, `48_`, `49_Industry_Portfolios_daily_CSV.zip` (naming from memory; library page lists "5 Industry Portfolios [Daily]" etc. `[s]`). Format (memory): zipped CSV, 1-3 header lines ("This file was created by CMPT_ME_BEME_RETS using the YYYYMM CRSP database"), blank line, header row, `YYYYMMDD,ret,...` in percent; industry files have multiple blocks ("Average Value Weighted Returns -- Daily", "Average Equal Weighted Returns -- Daily", ...) separated by blank lines; missing = -99.99 / -999 `[s]` (FFdownload replaces -99/-999/-99.99 with NA). Update cadence: "update the research data at least once a year, but we may update them at other times" and "Historical returns can change, for example, if CRSP revises its database" `[s]` (library page). In practice the daily files are refreshed roughly monthly with a 1-2 month lag (memory) -- so they cannot be the live spine, only the pre-1993 segment. Terms: only a "(c) Kenneth R. French" copyright line is visible `[s]`; no redistribution grant found. Needs the page read. |
| Vanguard total-market proxies | Yahoo | VTSMX 1992-04-27 (memory), VFINX 1976-08-31 (memory), VTI 2001-05-24 `[s]`, SPY 1993-01-22 `[s]` | daily | Mutual fund adjusted closes on Yahoo include distributions (with the capital-gains caveat above `[s]`). VTSMX tracked the Wilshire 5000 until 2005, then MSCI US Broad Market, then CRSP US Total Market from 2013 (memory). |
| MSCI USA / MSCI USA IMI | MSCI end-of-day index search | 1969-12-31 monthly, daily later | daily | Free to view, MSCI's terms forbid redistribution (memory). Not usable. |

**Which free daily total-return series exist before the first ETF (SPY, 1993):** (1) Fama-French `Mkt-RF + RF` daily from 1926-07 and its industry portfolios; (2) ^SP500TR daily from 1988-01-04 on Yahoo; (3) Vanguard/Fidelity mutual-fund adjusted NAVs on Yahoo (VFINX 1976, VTSMX 1992, Fidelity Selects 1981) -- investable, net of fees. Everything else free is price-only or monthly.

---

## 3. Sectors

- **Select Sector SPDRs**: the original nine (XLK, XLF, XLE, XLV, XLY, XLP, XLI, XLB, XLU) "commenced investment operations on December 16, 1998" `[s]` (SEC 485BPOS); first Yahoo price rows are 1998-12-22 (memory). XLRE inception 2015-10-07 `[s]`; XLC 2018-06-18 or 06-19 (sources disagree) `[s]`.
- **S&P 500 GICS sector indices**: GICS "was created in 1999" and S&P DJI "extended GICS classifications back to 1989" `[s]`; sector indices "launched on June 28, 1996", Real Estate 2016-09-19 `[s]`; "First Value Year" 1989 with charts from 1989-12-31 `[s]` (S&P DJI education PDF). The 1989-1996 values are back-filled. Yahoo carries `^SP500-45` style tickers (mapping confirmed on other sites `[s]`), start date on Yahoo unknown (likely ~2000s), and S&P data carries the reproduction restriction noted above.
- **Fama-French industry portfolios** (daily, TR, 1926-07): 5/10/12/17/30/38/48/49 groupings. The 10- and 12-industry sets map reasonably onto GICS sectors (NoDur~Staples, Durbl+Manuf~Industrials/Discretionary, Enrgy~Energy, HiTec~IT, Telcm~Communication, Shops~Discretionary, Hlth~Health Care, Utils~Utilities, Money~Financials, Other). Sector definitions are SIC-based and reconstituted annually `[s]`, so they are not the same universe as an S&P 500 sector ETF.
- **Live, investable pre-1998 sector proxies**: Fidelity Select Portfolios (FSPHX Health Care and FSENX Energy both 1981-07-14 `[s]`; FSPTX Technology 1981 per memory, not confirmed `[s]`), Vanguard Health Care VGHCX and Vanguard Energy VGENX both 1984-05-23 `[s]`. Actively managed, fee-laden, and their Yahoo adjusted history depends on Yahoo having every distribution `[s]`.

**How to define "a sector" honestly back to 1990:** present three tiers in the UI and label them. Tier A, 1998-12-22 onward: the actual Select Sector SPDR (what a DCA investor could buy). Tier B, 1990-1998: either (i) a Fama-French 10/12-industry value-weighted portfolio, clearly labelled "academic index, not investable, SIC-based, includes all CRSP stocks", or (ii) a named mutual fund (Fidelity Select / Vanguard sector fund) labelled as such. Do not splice B onto A silently; show the splice date on the chart and let the user toggle. Do not use S&P's back-filled 1989 sector indices: they are not free to redistribute.

---

## 4. Macro and market series for conditions (FRED first)

### FRED access and terms

- API key is free; "Your FRED API implementation must use this key, and the Federal Reserve Bank of St. Louis will block requests with an invalid key" `[s]` (terms_of_use.html). "By using the FRED API, you agree to the FRED API Terms of Use" and the Bank "reserve[s] the right to update and change the Terms of Use from time to time without notice" `[s]`. Rate limit 120 requests/minute per key, HTTP 429 beyond `[s]` (third-party docs; not read on FRED).
- `https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES` returns CSV with no key `[s]` (multiple third parties). Handy fallback, undocumented.
- FRED general terms: you may build an app using "a subset of FRED data" via the API; scraping is restricted "except as expressly allowed by the terms of use applicable to the FRED API"; "For anything other than your own personal use, refer to the full FRED Services Terms of Use" `[s]`. The decisive point: **third-party series carry their owners' terms**, and FRED's series notes say so per series. Examples below.
- Vintages: `realtime_start`/`realtime_end` on `series/observations`, `vintage_dates`, `output_type=2` (by vintage date) `[s]` (fredr docs); `series/vintagedates` lists vintage dates `[s]`; a cap of 2,000 vintage dates per request means chunking `[s]` (code comment). Release dates: `release/dates?release_id=...` (FRED API; CPI release id is 10 from memory; ALFRED shows CPI at `release/downloaddates?rid=345`? -- the rid seen was 345 `[s]`, reconcile). BLS has published CPI release dates in advance since 1961 and keeps historical schedules as PDFs `[s]` (bls.gov/bls/histreleasedates.pdf).

### Series table

| Concept | FRED id | Start | Freq | Terms / notes |
|---|---|---|---|---|
| VIX | VIXCLS | 1990-01-02 `[s]` (ALFRED) | daily | Cboe copyright, "Reprinted with permission" style note (memory); FRED tags it citation-required `[s]`. Cboe's own file: `https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv`, dates `m/d/Y`, close-only 1990-1992 then OHLC `[s]`; Cboe warns its URLs change often `[s]`. |
| Old VIX (VXO, S&P 100) | VXOCLS (DISCONTINUED) | 1986-01-02 (memory); ends 2021-09-22/23 `[s]` (two ALFRED listings disagree on end) | daily | Cboe stopped VXO in September 2021 `[s]`. Only useful to extend a "fear" condition to 1986-1989. |
| 10y Treasury | DGS10 | 1962-01-02 `[s]` | daily | Fed H.15, public domain. |
| 2y Treasury | DGS2 | 1976-06-01 `[s]` (FRED table shows 7.26 on that date) | daily | H.15. |
| 3m bill | DTB3 (secondary market) 1954-01-04 `[s]`; DGS3MO (constant maturity) 1982-01-04 `[s]` (one third party says 1981-09-01 `[s]`) | daily | H.15. |
| Fed funds | DFF 1954-07-01 `[s]` daily; FEDFUNDS monthly 1954-07 (memory) | daily / monthly | H.15. |
| Unemployment | UNRATE | 1948-01 `[s]` | monthly | BLS, public domain. Revised (seasonal factors); use ALFRED vintages. |
| CPI | CPIAUCSL | 1947-01 (memory; not confirmed `[s]`) | monthly | BLS. Release dates: BLS schedule / FRED `release/dates`. |
| Nonfarm payrolls | PAYEMS | 1939-01 `[s]` (ALFRED) | monthly | BLS. Heavily revised (two monthly revisions plus annual benchmark) -- the poster child for the vintage problem. |
| 10y-2y spread | T10Y2Y | 1976-06-01 `[s]` (0.68 on that date) | daily | Derived from H.15. |
| Consumer sentiment | UMCSENT | 1952-11 in the table, but FRED notes monthly begins 1978-01 and pre-1978 is UMCSENT1 (discontinued) `[s]` | monthly | University of Michigan; FRED notes carry a Michigan copyright/permission line (memory). Preliminary vs final values -- vintage issue again. |
| AAII sentiment | not on FRED | weekly since July 1987 `[s]` | weekly | "The complete weekly historical dataset is available to AAII members" `[s]`; the legacy public URL `aaii.com/files/surveys/sentiment.xls` was cited in 2017 `[s]`, status unknown. AAII copyright; no redistribution right. Probably exclude or make it a user-uploaded series. |
| Shiller CAPE | shillerdata.com ie_data.xls (Nasdaq Data Link MULTPL feed stopped Jan 2024 `[s]`) | 1881-01 | monthly | See section 2. |
| Gold | GOLDAMGBD228NLBM / GOLDPMGBD228NLBM | 1968-04-01 (memory) | daily | **At risk**: ICE Benchmark Administration had historical LBMA data pulled from the World Gold Council site 2025-03-18 ("Historical LBMA Gold Price data has been removed at the request of the ICE Benchmark Administration") `[s]`; Banque de France and Platts also stopped republishing in 2025 `[s]`. FRED's series status unconfirmed. Alternatives: GLD ETF on Yahoo from 2004-11-18 (memory); World Bank Pink Sheet monthly since 1960, CC BY 4.0 (memory). |
| Oil (WTI) | DCOILWTICO | 1986-01-02 `[s]` | daily | EIA, public domain. |
| Dollar index | DTWEXBGS | 2006-01-02 `[s]`, index Jan 2006=100 | daily | Fed H.10. The legacy DTWEXB (1973-2019) and DTWEXM (retired Jan 2020 `[s]`) are discontinued. For 1990-2005 use DTWEXM (Major Currencies, 1973-01-02 to 2019-12-31, memory) spliced, or ICE DXY via Yahoo `DX-Y.NYB` (memory, terms unclear). |
| High-yield spread | BAMLH0A0HYM2 | 1996-12-31 `[s]` (FRED table) | daily | **Restricted**: "Copyright, 2023, ICE Data Indices" ... "reproduction of this data in any form is prohibited except with the prior written permission of ICE Data Indices" `[s]`; and a FRED page states that "starting in April 2026, this series will only include 3 years of observations" `[s]`. Do not commit this series to the repo. |
| Bitcoin | CBBTCUSD (Coinbase) | 2014-12-01 `[s]` (first value 370) | daily incl. weekends | Coinbase source; FRED notes terms unknown. Yahoo BTC-USD from 2014-09-17 (memory; a Kaggle copy says 2014-09-14 `[s]`). Pre-2014: Bitstamp from 2011, Mt. Gox from 2010 only via Kaggle dumps (various licenses). |

### The vintage / revision problem

FRED's default `series/observations` returns the latest revised values. A condition like "unemployment rate rose vs. prior month" evaluated on revised data uses numbers nobody had at the time (PAYEMS first prints are routinely revised by tens of thousands; UNRATE seasonal factors are re-estimated each January). ALFRED stores every vintage. The honest implementation for conditions on BLS/BEA series: for each observation date, take the value from the first vintage whose `realtime_start` is on or after the release date (= "as first published"), and apply the condition only from the release date onward, not the reference month. For market series (yields, VIX, oil, dollar) there is no revision problem beyond rare corrections. For CPI, PAYEMS, UNRATE, UMCSENT, store two columns: `first_print` and `latest`, and let the UI default to `first_print` with the release date as the effective date. Vintage pulls are heavy (2,000-vintage cap per request `[s]`), so do them once and commit.

---

## 5. Dividends and splits

**Where to get raw events per ticker**

- `yahoo-finance2 chart({ events: 'div|split' })` -> `events.dividends[] {amount, date}` and `events.splits[] {date, numerator, denominator, splitRatio}` `[v]`. The `date` is the ex-date; `amount` is in current (post-split) share terms (memory). No pay date, no record date.
- Tiingo EOD rows: `divCash`, `splitFactor` on the ex-date `[s]`. No pay date.
- Polygon/Massive `/v3/reference/dividends`: `ex_dividend_date`, `record_date`, `pay_date`, `declaration_date`, `cash_amount`, `frequency` `[s]`; free tier, 2-year window `[s]`. The only free structured pay-date source I found, and only for recent years.
- `api.nasdaq.com/api/quote/{SYM}/dividends?assetclass=stocks` (ETFs: `assetclass=etf`) returns ex-date, record, payment, declaration (memory); unofficial, needs browser-like headers, no terms grant `[s]` (wrapper library disclaims affiliation).
- EDGAR: declarations live in 8-K/press-release exhibits and fund N-CSR schedules; XBRL tags like `CommonStockDividendsPerShareDeclared` exist in 10-Q/10-K but with no pay dates for every event. Not practical as a feed.
- Issuer pages (State Street's SPY distribution schedule) are authoritative for the ETFs that matter; SPY ex-dates are around the third Friday of Mar/Jun/Sep/Dec and pay about six weeks later ("about 42 days after each ex-dividend date") `[s]`, e.g. ex 2026-03-20 paid 2026-04-30 `[s]`.

**How adjusted close handles them.** For each ex-date, every earlier close is multiplied by `(1 - D / C_{ex-1})` (dividends) and by the split ratio (splits) `[s]`. This is the CRSP convention: it is mathematically identical to reinvesting D at the cum-dividend close the night before the ex-date. The whole history is rewritten at every new event `[s]`.

**Why a DCA backtest should reinvest on the pay date instead.**

1. Timing. Adjusted close assumes cash arrives and is reinvested at `C_{ex-1}`; the cash actually arrives 2-6 weeks later (SPY ~42 days `[s]`; most common stocks 2-4 weeks; mutual funds reinvest on the pay/reinvest date, usually same or next day). Between ex and pay the dividend is not in the market.
2. Lots. A DCA strategy buys on a schedule and under conditions; a dividend reinvested on the pay date is an extra lot at the pay-date price, which the strategy's own rules (e.g. "skip buys when VIX > 30") may or may not want. Adjusted close bakes in an unconditional reinvestment.
3. Conditions on price. Rules such as "buy when price is 10% under its 52-week high" must run on the *unadjusted* (split-adjusted only) close that the investor saw. A dividend-adjusted series lowers all past prices, so drawdowns computed on it are smaller than the investor experienced and highs are hit at different dates. You need both series anyway: `close` (split-adjusted) for conditions and dividend events for cash flows. `adjclose / close` recovers the cumulative dividend factor if events are missing.
4. Taxes/cash-drag toggles become possible (withhold, reinvest, or sweep to a cash bucket).

**Size of the error from using adjusted close instead.** Per event, the difference in units bought is `D/P_ex-1 - D/P_pay`, i.e. the yield of that payment times the price move between ex and pay. For a 0.4% quarterly payment and a typical 2-3% six-week move, that is about 0.01% of the portfolio per event, random in sign; over 35 years (~140 events) the terminal-wealth difference is usually well under 0.5%, with no systematic bias in direction (expected drift between ex and pay is slightly positive, so adjusted close very slightly *overstates* total return by roughly the dividend yield times six weeks of expected return, ~0.02%/yr). For high-yield names, special dividends, or monthly payers the error grows but stays small relative to Yahoo's data-quality errors (missing dividends `[s]`, unadjusted capital-gains distributions `[s]`). Conclusion: the pay-date model is worth doing for correctness of the *strategy logic* (points 2-3), not because adjusted close is numerically far off. Where no pay date exists (pre-2024 history on free sources), approximate pay date as ex-date + N days by instrument type (ETF ~30-45, stock ~21, fund 0-1) and label it.

---

## 6. Trading calendar

- **pandas_market_calendars** (PyPI 5.6.0, MIT `[v]`): NYSE calendar documented as "Exchange calendar for NYSE from 1885-01-01" `[v]` with every special close, late open and early close since then listed in the module docstring, and the lists implemented in `holidays/nyse.py` `[v]`. Verified entries (`[v]`): September11Closings2001 = 2001-09-11..14; HurricaneSandyClosings2012 = 2012-10-29, 10-30; NixonFuneral1994 = 1994-04-27; ReaganMourning2004 = 2004-06-11; FordMourning2007 = 2007-01-02; GeorgeHWBushDeath2018 = 2018-12-05; JimmyCarterDeath2025 = 2025-01-09; Juneteenth from 2022; late opens 2001-09-17 (9:33, moment of silence), 2004-06-07 and 2006-12-27 (9:32); 1997-10-27 circuit-breaker early close 3:30pm; 1981-03-30 early close 3:17pm (Reagan shooting). Early closes 1pm on day after Thanksgiving, Christmas Eve, and July 3 when applicable are all enumerated per year `[v]`.
- **exchange_calendars** (PyPI 4.13.2; license Apache 2.0 `[v]` from the repo LICENSE file -- PyPI metadata has no license field `[v]`): XNYS calendar lists the same closures: "Closed on 4/27/1994 ... 6/11/2004 ... 1/2/2007 ... 10/29/2012 and 10/30/2012 ... 12/5/2018 ... 1/9/2025" and Juneteenth since 2022 `[v]`.
- Both are Python. For a JS build you can either (a) run the Python package once in the Action to emit `calendar.json` (list of trading days + early-close dates 1990-present) and commit it, or (b) port the ~30 relevant rules since 1990. The committed JSON is tiny (about 9,000 dates). NYSE's own historical holiday page (nyse.com) was unreachable; it is the primary source the packages cite along with an archived nyse.com timeline `[v]`.
- Why it matters: the price feed defines trading days implicitly, but a DCA schedule ("buy the 1st of every month") needs "next trading day on or after", and conditions like "N days since" need a calendar independent of any one ticker's gaps (Yahoo sometimes drops days, e.g. the Ford mourning day sometimes appears as a zero-volume row -- memory).

---

## Recommendation

**Spine (prices).** Keep Yahoo via `yahoo-finance2 chart()` as the daily spine, same as the existing site, because nothing free matches its depth plus adjusted close plus events for ~200 symbols. Store per symbol: `close` (split-adjusted), `adjclose`, and the `dividends`/`splits` event lists, as compact column arrays. Fetch incrementally from the last committed date, retry with backoff, never fail the build on a fetch error (keep the previous JSON). Add Stooq ^SPX/^DJI as an offline cross-check, not a dependency. Pre-1993 segments: ^SP500TR (1988+) and Fama-French market and industry files (1926+, refreshed monthly, lagging) downloaded by a separate, rarely-run step.

**What is honest to claim.**
- "Daily total return since 1990" is true for: the S&P 500 (^SP500TR from 1988), any mutual fund with Yahoo history (VFINX, VTSMX from 1992, Fidelity Selects from 1981) subject to Yahoo distribution gaps, and the Fama-French market/industry portfolios (academic, not investable).
- "Daily total return since 1993" for SPY; since 1998-12-22 for the nine sector SPDRs; since 2001 for VTI; later for most other ETFs.
- For single stocks: "from first trade date, currently listed names only; delisted companies are missing (survivorship bias)".
- For sectors before 1998-12: label as "academic industry portfolio" or "named mutual fund", never as "the sector".
- For Dow / Nasdaq / Russell: price return only (no free TR).
- For macro conditions on BLS/Michigan series: "as first published" via ALFRED, dated at release, or say "revised data, look-ahead bias".

**License posture.** The repo will contain redistributed data from sources that mostly do not grant redistribution. Tier it: (1) US-government series (H.15 yields, DFF, BLS, EIA oil, H.10 dollar) -- public domain, commit freely with FRED citation. (2) Cboe VIX, Coinbase BTC on FRED, Fama-French, Shiller -- academic/attribution-style, commit with citation and a NOTICE listing each source's page; confirm Ken French and Shiller pages for any explicit terms. (3) Yahoo-sourced prices -- no grant; same risk the existing site already carries; keep the committed form minimal (closes and events, not Yahoo's full payload) and attribute. (4) Do **not** commit: ICE BofA spreads (explicit written-permission requirement `[s]` and the 3-year truncation `[s]`), S&P sector indices or FRED SP500 (S&P permission requirement `[s]`), Wilshire (removed from FRED `[s]`), AAII (members only `[s]`), MSCI, LBMA gold if FRED has dropped it, Twelve Data/marketstack (non-commercial / internal-use clauses `[s]`). Make the data-loader table-driven so a series can be removed by deleting a row.

**Series -> source -> start -> floor the UI should show**

| Series | Source | Data start | UI floor (earliest date to offer) | Why the floor |
|---|---|---|---|---|
| S&P 500 total return | Yahoo ^SP500TR | 1988-01-04 `[s]` | 1990-01-02 | Project's stated horizon; TR exists. |
| S&P 500 price | Yahoo ^GSPC | 1927-12-30 (mem) | 1990-01-02 | Price-only; label "no dividends". |
| SPY (investable S&P) | Yahoo | 1993-01-29 first close (mem; inception 1993-01-22 `[s]`) | 1993-02-01 | First full month. |
| Total US market, investable | Yahoo VTSMX / VTI | 1992-04-27 (mem) / 2001-05-24 `[s]` | 1992-05-01 (VTSMX) | VTI too late; VTSMX fund NAV. |
| Total US market, academic TR | Fama-French Mkt-RF + RF | 1926-07-01 (mem) | 1990-01-02 | Label academic, monthly-lag refresh. |
| Dow, Nasdaq Comp, Russell 2000 | Yahoo ^DJI / ^IXIC / ^RUT | 1992-01-02 / 1971-02-05 / 1987-09-10 (mem) | 1992-01-02 / 1990-01-02 / 1990-01-02 | Price-only; Dow floor set by Yahoo depth (verify). |
| Nine sector SPDRs | Yahoo XLK...XLU | 1998-12-22 (mem; inception 1998-12-16 `[s]`) | 1999-01-04 | First full year start. |
| XLRE / XLC | Yahoo | 2015-10-07 / 2018-06-18-19 `[s]` | 2015-11-02 / 2018-07-02 | |
| Sector before 1998 | FF 10/12 industry daily, or Fidelity Select / Vanguard sector fund | 1926-07 / 1981-07-14 / 1984-05-23 `[s]` | 1990-01-02, labelled proxy | Toggle, splice line on chart. |
| Any single stock or ETF | Yahoo | `meta.firstTradeDate` `[v]` | max(firstTradeDate, 1990-01-02) | Survivor-only banner. |
| VIX | FRED VIXCLS (Cboe CSV backup) | 1990-01-02 `[s]` | 1990-01-02 | Exact match to horizon. VXO 1986-2021 optional extension. |
| 10y, 2y, 3m yields; 10y-2y | FRED DGS10 / DGS2 / DTB3 or DGS3MO / T10Y2Y | 1962 / 1976-06-01 / 1954 or 1982 / 1976-06-01 `[s]` | 1990-01-02 | |
| Fed funds | FRED DFF | 1954-07-01 `[s]` | 1990-01-02 | |
| Unemployment, CPI, payrolls | FRED/ALFRED UNRATE, CPIAUCSL, PAYEMS | 1948 / 1947 / 1939 `[s]`(mem for CPI) | 1990-01 (effective at release date) | First-print vintages. |
| Consumer sentiment | FRED UMCSENT | monthly from 1978-01 `[s]` | 1990-01 | Prelim/final vintage caveat. |
| Oil | FRED DCOILWTICO | 1986-01-02 `[s]` | 1990-01-02 | |
| Dollar index | FRED DTWEXBGS (+DTWEXM splice) | 2006-01-02 `[s]` (DTWEXM 1973, mem) | 2006-01-02 unless spliced; label splice | |
| High-yield spread | FRED BAMLH0A0HYM2 | 1996-12-31 `[s]` | **exclude from committed data** | ICE permission + 3-yr truncation `[s]`. If used at all, client-side fetch is also redistribution-free but needs a key; skip. |
| Shiller CAPE | shillerdata.com | 1881-01 | 1990-01 (monthly) | Monthly step series; cite Shiller. |
| Gold | FRED LBMA (if alive) else GLD | 1968 / 2004-11-18 | 2004-11-18 unless FRED LBMA confirmed | ICE pull-back of LBMA history `[s]`. |
| Bitcoin | FRED CBBTCUSD | 2014-12-01 `[s]` | 2014-12-01 | 7-day series; align to trading days. |
| AAII sentiment | AAII (members) | 1987-07 `[s]` | not offered | Terms. |
| Trading calendar | pandas_market_calendars NYSE -> committed JSON | 1885 `[v]` | 1990-01-02 | MIT `[v]`. |

**Open items to verify by opening the blocked hosts** (in priority order): Yahoo US ToS wording; Ken French data library terms; FRED API terms_of_use.html full text and the per-series notes for VIXCLS, UMCSENT, CBBTCUSD, GOLDAMGBD228NLBM (alive?), SP500 (new S&P agreement scope); Tiingo license page (redistribution clause) in case Tiingo replaces Yahoo for events; Stooq terms.html; Yahoo first-trade dates for ^DJI, ^RUT, ^IXIC, VFINX, VTSMX, XLK; Kaggle license fields for the Marjanovic and Onyshchak dumps; Cboe VIX_History.csv URL liveness; shillerdata.com download URL and any terms.
