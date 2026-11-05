# Event-calendar data sources for the DCA backtester

Research notes, 2026-11-05. Scope: historical dates of recurring financial-news events since ~1990 that a build script can fetch and commit as datasets.

## How to read this

- **[v]** = I read the page/file/package itself this session (curl of a raw file, npm/PyPI registry metadata, package source, or ran the code). Everything else came from web-search result snippets or prior knowledge and **needs checking** against the primary page before it goes in a spec.
- **Network caveat for this session:** the sandbox proxy refused CONNECT (403) to essentially every primary host: federalreserve.gov, fred/alfred/fraser.stlouisfed.org, bls.gov, bea.gov, census.gov, sec.gov/data.sec.gov/efts.sec.gov, treasury.gov, kansascityfed.org, ismworld.org, alphavantage.co, finnhub.io, financialmodelingprep.com, api.nasdaq.com, aa.usno.navy.mil, lseg.com, nyse.com, cboe.com, everycrsreport.com, huggingface.co, github.com (HTML), api.github.com (repo endpoints). Reachable: registry.npmjs.org, pypi.org, files.pythonhosted.org, raw.githubusercontent.com. So primary-agency pages are cited by URL from search results, not read. Mark-ups reflect that honestly.
- Source rules followed: no X/Twitter, Grok, Grokipedia, or other Musk-owned properties cited.

---

## 1. FOMC meetings

### 1a. Meeting dates (the authoritative list)

| Item | Detail | Status |
|---|---|---|
| Current calendars | `https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm` — page title "Meeting calendars, statements, and minutes (2021-2027)"; lists the eight scheduled meetings per year with statement/minutes/projection links; unscheduled meetings appear inline (e.g. March 2020) | URL seen in search results; page not read. Needs checking that unscheduled entries are labelled "(unscheduled)" in markup you can key on. |
| Historical materials index | `https://www.federalreserve.gov/monetarypolicy/fomc_historical.htm` — "View transcripts and historical materials by year", 1936 onward | Not read. |
| Per-year pages | `https://www.federalreserve.gov/monetarypolicy/fomchistoricalYYYY.htm` (pattern confirmed indirectly: FedTools scrapes `fomccalendars.htm` for recent years and switches to the historical pages below a `historical_split` year, default 2014 [v]; archived copy of `fomchistorical2003.htm` appears in UNT web archive search results) | Pattern needs a direct check. |
| Format | HTML only. No CSV/JSON/API from the Board. The per-year pages list each meeting (and conference calls) as headings with links to statement, minutes, transcript, Tealbook/Greenbook, etc. | — |
| Fetch strategy | Scrape the per-year HTML pages for 1990–(current−5) and `fomccalendars.htm` for the latest years; parse meeting headings into `{start_date, end_date, type: scheduled|unscheduled|conference_call}`. Materials for the most recent five years live only on the calendar page (transcripts are released with a five-year lag). | — |
| Mirror / fallback | FRASER (St. Louis Fed) hosts "Federal Open Market Committee Meeting Minutes, Transcripts, and Other Documents" as title 677 (`https://fraser.stlouisfed.org/title/677`) with per-meeting items ("Meeting, March 18, 1936"). FRASER has a REST API with API key (`https://fraser.stlouisfed.org/api/item/{id}`) and OAI-PMH. Search snippets say "most FRASER documents are in the public domain". | Not read; needs checking. Title 677 is the right collection per search results. |
| License | Board of Governors content is U.S. government work; federalreserve.gov has no restrictive terms that I know of for data reuse. | Needs checking. |

**Existing machine-readable lists (quality):**

- `borisjoffe/FOMC-dates.js` — `dates.csv` [v]: **31 rows, 2021-01-27 → 2024-12-18 only**, one ISO date per meeting (second day of two-day meetings), second column `*` marks SEP meetings. Too shallow; README not found at master/main (404) [v].
- `David-Woroniuk/FedTools` (PyPI `fedtools`) [v README]: Python scraper returning DataFrames of statements/minutes/Beige Books indexed by release date; README says minutes "since 1993"; example `start_year = 1994`; scrapes `fomccalendars.htm` with `historical_split = 2014`. Useful as a reference implementation, not as a dataset.
- `marcburri/ScrapeFOMC` [v README]: Python/Selenium scraper for meeting dates + documents, `startyear = 1936`, history "up to 2016 at the moment"; full DB "more than 5 GB". Not a dataset.
- R-bloggers "FOMC Dates – Full History Web Scrape" (2015): scraped meeting dates from 1936 into a CSV; notes statements begin Feb 1994. Needs checking; likely stale.
- Hugging Face `JasonShi80/fomc-statements-minutes` (`communications.csv`): statements and minutes text, begins 2000, updated weekly. Not read (host blocked). Text-oriented, not a dates list.
- FRED Blog (search snippet): "over the past 20 years, the FOMC has held 184 meetings, 30 of which were unscheduled" — useful sanity count for a scraper. Needs checking.
- npm registry search for "fomc" [v]: nothing that is a plain dates dataset (results are MCP servers / trading tools).

**Verdict:** no trustworthy ready-made CSV. Build your own from the Board's HTML; cross-check meeting count per year (8 scheduled since 1981) and against DFEDTAR change dates.

### 1b. Statements: existence and release time

| Period | Practice | Status |
|---|---|---|
| Before Feb 1994 | No post-meeting statement. Policy changes were inferred from open-market operations; decisions published later in the "Record of Policy Actions" / minutes. | Dallas Fed Economic Letter (Sept 2013) and Fed FAQ cited in search; needs checking. |
| 1994-02-04 | First post-meeting statement (Greenspan, 25 bp hike). `https://www.federalreserve.gov/FOMC/19940204default.htm` | Not read. |
| 1994–1999 | Statements only when policy changed (plus some bias announcements). | Needs checking. |
| May 1999 / Jan–Feb 2000 | Fed FAQ: statements after every meeting "since May 1999"; a Jan 19, 2000 press release formalised "a statement to the public immediately after every meeting" (first balance-of-risks statement Feb 2000). | Needs checking; two dates appear in sources. |
| Release time ~2:15 pm ET | Typical from the late 1990s through March 2013 (varied in the 1990s). On press-conference days Apr 2011–Jan 2013 the statement moved to **12:30 pm** with the press conference at 2:15 pm. | Needs checking (Forexlive 2011 snippet; bondbuyer). |
| 2013-03-13 press release | "Federal Reserve announces time changes for FOMC statements and news conferences": statements for all regularly scheduled meetings at **2:00 pm ET**, press conference ~2:30 pm, effective with the **March 19–20, 2013** meeting. `https://www.federalreserve.gov/newsevents/pressreleases/monetary20130313a.htm` | Not read; multiple secondary confirmations. |
| Unscheduled moves | Released at odd times: e.g. 2020-03-03 ~10:00 am ET; 2020-03-15 Sunday ~5:00 pm ET; 2008-10-08 ~7:00 am ET (coordinated); 2001-01-03 ~1:15 pm ET. | From memory; needs checking against each press release. |

### 1c. Unscheduled meetings and intermeeting rate changes (1990+)

Known intermeeting target changes/emergency actions (prior knowledge + search confirmation where noted): many in 1990–1992 (easing cycle implemented via conference calls/Chairman discretion), 1994-04-18 (hike), 1998-10-15 (cut), **2001-01-03**, **2001-04-18**, 2001-09-17 (pre-open after 9/11 closure), 2007-08-17 (discount rate only), **2008-01-22**, **2008-10-08**, **2020-03-03**, **2020-03-15** (Sunday). The six bolded dates were confirmed as intermeeting/emergency moves in search results; the rest need checking.

**Recommended derivation:** take the daily FRED target series (below), find every date the target changed, and tag changes that do not fall on a scheduled meeting end-date as `intermeeting`. That captures every intermeeting *rate* move since 1982 without parsing conference-call pages. Unscheduled meetings with no rate change (e.g. 2001-09-13 call, several 2008 calls) only appear in the Board's HTML.

### 1d. FRED target-rate series

| Series | Coverage | Notes | Status |
|---|---|---|---|
| `DFEDTAR` Federal Funds Target Rate (DISCONTINUED) | 1982-09-27 → 2008-12-15 (last obs 1.00) | Daily step series. Pre-1994 values come from the Thornton working paper "A New Federal Funds Rate Target Series: September 27, 1982 – December 31, 1993" (FRED Blog). | Search snippets; needs checking. |
| `DFEDTARU` / `DFEDTARL` | 2008-12-16 → present | Upper/lower bound of target range. FRED has said it will not splice these with DFEDTAR. | Same. |
| Fetch | FRED CSV download `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFEDTAR` (no key) or FRED API `fred/series/observations` (key). | Needs checking. |
| License | FRED general terms: series labelled "Public Domain: Citation requested" may be used and displayed with attribution. **FRED API terms (search snippet of a FRED announcement): the API may not be used "in connection with storing, caching, or archiving any portion of FRED® Services or FRED® Content"** and not for "development or training of any ... machine learning" systems. That clause is a problem for a build script that commits API output; prefer the no-key `fredgraph.csv` download or go to the Board's own H.15 / press releases. Quote and date of the announcement need checking at `https://fred.stlouisfed.org/docs/api/terms_of_use.html` and `https://fred.stlouisfed.org/legal/terms/`. | Needs checking. |

### 1e. Press conferences

- First regular post-FOMC press conference **2011-04-27** (Bernanke); four per year (SEP meetings) through 2018; **every meeting from January 2019** (announced 2018-06-13 by Powell). Source: FEDS Note 2021-10-12 "Questions and Answers: The Information Content of the Post-FOMC Meeting Press Conference" and FRASER blog 2019-05. Needs checking.
- Dataset: the SEP-flag column (meetings with projections) equals press-conference meetings for 2011–2018; from 2019 every meeting. The Board's calendar page marks "Press Conference" per meeting. Scrape alongside 1a.
- Note: one CME/Econoday item in search results refers to a "Chair Kevin Warsh" press conference in 2026; treat the current chair as a fact to verify when the spec is written, not something this report asserts.

### 1f. Two-day meetings

- Bond Buyer headline (search result): "2009 FOMC meetings now all two days each". Before 2009 a mix of one- and two-day meetings. The statement is released on the **last day** of the meeting. Store `start_date`/`end_date` and define "day of a Fed meeting" = `end_date`. Needs checking.

---

## 2. BLS releases

### 2a. Employment Situation (jobs report)

| Item | Detail | Status |
|---|---|---|
| Current/upcoming schedule | `https://www.bls.gov/schedule/news_release/empsit.htm` (HTML table; also `https://www.bls.gov/cps/publications/release-calendar.htm` and `https://www.bls.gov/ces/publications/news-release-schedule.htm`) | Not read. |
| Per-year full BLS schedules | `https://www.bls.gov/schedule/YYYY/home.htm` — search results show these exist for at least 1999–2008, 2012, 2022, 2023; likely every year 1999→present. Earlier (2004, 2005) layouts archived at UNT (`webarchive.library.unt.edu/.../www.bls.gov/schedule/schedule/2005/2005_sched.htm`). | Pattern needs checking for the full 1999–2026 range. |
| Pre-2001 archive (the key document) | **`https://www.bls.gov/bls/histreleasedates.pdf`** — "Release dates for national employment and unemployment estimates, 1957–2000", plus CPI, PPI, and ECI release dates; notes "BLS began announcing its scheduled release dates in advance in 1961"; dashes where the date is unknown; footnotes for anomalies (e.g. Dec 1995 estimates scheduled 1996-01-05 "delayed two weeks" — one snippet attributes this to a premature internet leak; another plausible cause is the Dec 1995–Jan 1996 shutdown — resolve by reading the footnote). | PDF not read; needs checking. This single PDF + per-year HTML pages cover 1957→present. |
| Release time | 8:30 am ET. | Standard; needs a citation line from the schedule page. |
| Timing rule | BLS CES page (snippet): released "typically on the third Friday after the conclusion of the reference week" (reference week = week containing the 12th). This is more precise than "first Friday": it explains why some reports land on the second Friday (e.g. when the 12th falls late in the month or a holiday intervenes). Holidays (July 4 on a Friday → Thursday release) also shift it. | Needs checking. |
| Shutdown exceptions | **1995–96**: Dec 1995 report delayed (see histreleasedates footnote). **2013**: Sept 2013 report moved from Oct 4 to **Oct 22, 2013** (confirmed by multiple news sources in search); Oct 2013 report also delayed (Nov 8). **2018–19**: DOL/BLS were already funded (FY2019 Labor-HHS enacted), so Dec 2018 (Jan 4) and Jan 2019 (Feb 1) reports were on schedule; Commerce (BEA/Census) releases were delayed ~1 month. **2025**: Sept 2025 report (due Oct 3) delayed; **October 2025 Employment Situation not published** (household survey not collected); Nov 2025 report moved from Dec 5 to Dec 16; BLS posted `https://www.bls.gov/bls/2025-lapse-revised-release-dates.htm`. Search results also reference a further lapse in early 2026 that kept the Jan 2026 report from its Feb 6, 2026 date. | 2013 and 2018–19 well supported by search; 2025/2026 details need checking against the BLS revised-dates page. |
| License | BLS: "BLS allows free use of its public domain material without specific permission" and asks that you "cite BLS as the source" (`https://www.bls.gov/opub/copyright-information.htm`, snippet). Photos and the BLS emblem are excluded. | Snippet; needs checking. |

### 2b. CPI

- Schedule page `https://www.bls.gov/schedule/news_release/cpi.htm` (current year(s)); historical dates in the same `histreleasedates.pdf` (through 2000) and per-year `schedule/YYYY/home.htm` pages. Release 8:30 am ET, typically between the 10th and 15th. Not read; needs checking.

### 2c. PPI

- **`https://www.bls.gov/ppi/news-release/historical-release-dates-for-the-producer-price-index.pdf`** — "Release dates for the Producer Price Index, 1971–2025" (snippet). Older copy `bls.gov/ppi/ppirel.pdf` archived at UNT. Current schedule `https://www.bls.gov/schedule/news_release/ppi.htm`. Not read; needs checking.

### 2d. JOLTS

- First public release **July 2002** (developmental/experimental status), monthly series back to Dec 2000; became an official series April 2004 (BLS Handbook of Methods / MLR, snippets). Historical release dates: per-year `schedule/YYYY/home.htm` from 2002 onward; current `https://www.bls.gov/schedule/news_release/jolts.htm`. Release 10:00 am ET. The Sept 2025 JOLTS release was cancelled and folded into the Oct 2025 release (Dec 9). Needs checking.

### 2e. One machine-readable shortcut for all of these: ALFRED/FRED release dates

- ALFRED "Release dates" per release: `https://alfred.stlouisfed.org/release/downloaddates?rid=50` (Employment Situation) — snippet says it lists release dates **from May 6, 1955 through 2026**, downloadable as Excel or Text. Other `rid`s cover CPI, PPI, GDP, Personal Income and Outlays, Advance Retail Sales, Unemployment Insurance Weekly Claims, UMich Surveys of Consumers, etc.
- FRED API `fred/release/dates?release_id=N` (`https://fred.stlouisfed.org/docs/api/fred/release_dates.html`): docs say dates "are published by data sources and do not necessarily represent when data will be available on the FRED or ALFRED websites"; `include_release_dates_with_no_data`; max 10,000 per page.
- Caveats: (1) earliest date varies by release and needs checking per `rid`; (2) one snippet says the ALFRED list "contains the dates when any series from this release was revised", so confirm the list is release dates not vintage dates; (3) the FRED API "no storing/caching/archiving" clause above. The web download is probably the cleaner route to commit a file; cite "Source: BLS via ALFRED".
- Status: not read; this is the highest-value item to verify first because it could replace half of sections 2–3.

---

## 3. Other scheduled macro releases

| Release | Source / historical dates | Rule & time | Status |
|---|---|---|---|
| BEA GDP advance estimate, PCE (Personal Income & Outlays) | Current: `https://www.bea.gov/news/schedule`. Historical: BEA posted yearly "News Release Schedule" pages/PDFs, e.g. `bea.gov/newsreleases/2013rd.htm`, `.../general/pdf/2012rd.pdf` (UNT archive copies for 2012, 2013, 2017, 2021); later years published in the *Survey of Current Business* December issue, e.g. `https://apps.bea.gov/scb/issues/2020/12-december/1220-news-releases-2021.htm` (also 2022, 2023). BEA archive disclaimer (snippet): "provided for research only, and data may be superseded." | 8:30 am ET; advance GDP last week of Jan/Apr/Jul/Oct; delayed by 2013, 2018–19, 2025 shutdowns. | Not read. 1990s dates: ALFRED `rid` for "Gross Domestic Product" is the best bet; needs checking. |
| Advance Monthly Retail Sales (Census) | Census "Economic Indicators" calendar (current). Historical: `census.gov/retail/marts/www/martsdates.pdf` and `census.gov/retail/mrts/www/reldates.pdf` (UNT archive copies 2012–2013, 2020–2021). FRED/ALFRED names it "Advance Monthly Retail Sales (SIC Based)" 1966–2001 then "Advance Monthly Sales for Retail and Food Services" from June 2001. | 8:30 am ET, mid-month. | Not read. |
| ISM Manufacturing PMI | `https://ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/` (current year table). ISM: "released on the first business day of the month at 10:00 a.m."; Services on the third business day. No public historical table found; dates are computable (first business day, US federal/NYSE holidays) with low risk. ISM is a private org; its data is copyrighted (it left FRED years ago). Dates themselves are facts. | 10:00 am ET | Calendar page not read. |
| UMich Consumer Sentiment | `sca.isr.umich.edu` release schedule (not surfaced in search). Pattern: preliminary ~second Friday, final ~fourth/last Friday, 10:00 am ET. ALFRED `rid` for "Surveys of Consumers" should carry release dates. | 10:00 am ET | Not read; needs checking. |
| Conference Board Consumer Confidence | Private; "last Tuesday of the month, 10:00 am ET" per third-party calendars; one 2019 example released on a Wednesday. No public historical list; "Full historical release dates are reserved for Conference Board members and subscribers" (snippet). Rule-based with a handful of exceptions is the only free route. | 10:00 am ET | Needs checking. |
| Weekly initial jobless claims (DOL ETA) | Latest: `https://www.dol.gov/ui/data.pdf`; archive: `https://oui.doleta.gov/unemploy/claims_arch.asp` (per-release PDFs via an application tool; the page also lists upcoming non-Thursday dates, e.g. "Wednesday, November 25, 2026"). Rule: Thursday 8:30 am ET; Wednesday when Thursday is a federal holiday (Thanksgiving, sometimes July 4/Christmas/New Year). ALFRED `rid` for "Unemployment Insurance Weekly Claims Report" has release dates. | Thu 8:30 am ET | Not read. |
| Treasury quarterly refunding | `https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding` and archives `.../quarterly-refunding-archives` with "Official Remarks on Quarterly Refunding by Calendar Year" (1982→), "Financing Estimates by Calendar Year" (1991→), "Historical Quarterly Refunding Charts & Data 1976–2010", and 1990s press-conference transcripts e.g. `home.treasury.gov/system/files/221/ps-1991-q2.pdf`, `ps-1995-q3.pdf`. Pattern: financing estimates Monday 3:00 pm ET, refunding announcement **Wednesday 8:30 am ET** in the first week of Feb/May/Aug/Nov (e.g. 2025-02-05; 2026-11-04). | Wed 8:30 am ET | Not read; dates need scraping from the by-year remarks pages. |
| Fed Chair semiannual testimony (Humphrey-Hawkins / Monetary Policy Report) | `https://www.federalreserve.gov/monetarypolicy/mpr_default.htm` lists Feb/Jul testimony+report pairs by year back to 1996 (July 1996 first), with "Historical Archives: (2006–1996)" and `boarddocs/hh/` pages for 1996–2000s. FRASER has House and Senate hearing series back to 1979 (titles 672, 671) and the reports series (title 9332). Two testimony days per report (Senate and House on consecutive days). | ~10:00 am ET | Not read. 1990–1995 dates come from FRASER hearing records. |
| Jackson Hole symposium (Kansas City Fed) | `https://www.kansascityfed.org/publications/research/escp/symposiums/escp-archive` (by year); EconPapers mirror of proceedings gives exact dates 1982→2025 (e.g. Aug 9–10, 1982; Aug 21–23, 2008; Aug 21–23, 2025; 2026 announced Aug 27–29). Began 1978 (Kansas City), Jackson Hole from 1982. Chair's speech typically Friday morning ~10:00 am ET. | Late Aug, Thu–Sat | Not read. |
| Fed stress test results | Board press releases by year; SCAP results 2009-05-07; CCAR results March 2012–2016 (e.g. DFAST 2015-03-05 / CCAR 2015-03-11, 4:30 pm ET); June from 2017 (DFAST 2017-06-22; 2018-06-21/06-28; 2019+ late June). Dates are announced only weeks ahead; scrape `https://www.federalreserve.gov/supervisionreg/dfa-stress-tests.htm` or press-release archive. | 4:30 pm ET (after close) | Partially confirmed by search; needs checking per year. |
| Beige Book | Board: `https://www.federalreserve.gov/monetarypolicy/beigebookYYYY.htm` (per year, e.g. 1996 shows Oct 30, Dec 4) / `beige-book-default.htm`; **Minneapolis Fed archive 1970–present** (the Board's page says "1970 – present (on the website of the Federal Reserve Bank of Minneapolis)"). Public since 1983; released two weeks before each FOMC meeting at 2:00 pm ET. FedTools `BeigeBooks` scrapes it [v README]. | Wed 2:00 pm ET | Not read. |

---

## 4. Elections, inaugurations, shutdowns, debt ceiling

### 4a. Elections — rule is enough

- 2 U.S.C. §7: House elections "Tuesday next after the first Monday in November" of even years (`https://www.law.cornell.edu/uscode/text/2/7`, in search results); 3 U.S.C. §1 sets the same day for presidential electors every fourth year (not surfaced in search; standard). Compute: first Tuesday in Nov that is ≥ Nov 2. Midterms = even years not divisible by 4.
- Inauguration: Jan 20 (20th Amendment; Jan 21 public ceremony when the 20th is a Sunday — 1985, 2013). Not surfaced in search; standard; needs a citation.
- "Results known" dates need a tiny hand-made table (not computable): **2000** — Bush v. Gore decided 2000-12-12 (Gore conceded Dec 13); **2004** — AP called for Bush 11:07 am ET Nov 3 (snippet); **2020** — AP called for Biden **11:26 am ET Saturday 2020-11-07** (snippet); all other presidential elections since 1988 were called election night or early next morning (needs checking: 2016 ~2:30 am Nov 9; 2012 ~11:15 pm Nov 6; 2024 ~5:30 am Nov 6). Recommend: a 10-row committed JSON with a `called_at` timestamp and source link per row.

### 4b. Government shutdowns (funding gaps)

- Primary: CRS **RS20348 "Federal Funding Gaps: A Brief Overview"** (Table 1 lists every gap since FY1977; latest version 2026-05-26 on everycrsreport.com) and RL34680. Snippets confirm: Oct 1–17, 2013 (16 full days); CR expired Jan 19, 2018, gap "concluded on January 22, 2018, after lasting two full days"; CR expired Dec 21, 2018, concluded Jan 25, 2019 (34 full days); FY2026 gap began **Oct 1, 2025**, 42 full days (ended Nov 12, 2025). Two FY1996 gaps of 5 and 21 days (Nov 14–19, 1995; Dec 16, 1995–Jan 6, 1996 — dates from memory, need checking). Also Oct 5–9, 1990 (Columbus Day weekend) and a few-hours gap Feb 9, 2018. CRS counts 20 gaps since FY1977 as of the version quoted.
- Convention issue: CRS counts "full days" and starts the gap the day after the CR expires. Decide whether the dataset's `start` is the expiry date or the first lapsed day.
- Format: HTML/PDF table; hand-transcribe into JSON (≈20 rows) with CRS citation. Public domain (CRS work).

### 4c. Debt-ceiling standoffs

- Primary: CRS **R43389 "The Debt Limit Since 2011"**, **RL31967 "The Debt Limit: History and Recent Increases"**, **IN12045 "Federal Debt and the Debt Limit in 2025"**; Treasury "Debt Limit" page with Secretary letters to Congress (extraordinary-measures start dates and X-date estimates).
- Snippet-confirmed anchors: limit reached **2011-05-16** (extraordinary measures), Budget Control Act signed 2011-08-02; limit reached 2012-12-31, suspended by P.L. 113-3 until 2013-05-19, crisis resolved **2013-10-16/17**; Fiscal Responsibility Act signed **2023-06-03** (X-date estimate June 5); limit reinstated **2025-01-02** at $36.1T, raised $5T on **2025-07-04**. 1995–96 episode overlaps the shutdowns.
- Dataset: hand-made JSON of episodes `{measures_start, x_date_estimate, resolution_date, law}`; ~8 rows since 1990. Public domain sources.

---

## 5. Earnings dates per company (the hard one)

### 5a. SEC EDGAR — the defensible free route

| Item | Detail | Status |
|---|---|---|
| 8-K Item 2.02 "Results of Operations and Financial Condition" | Adopted in Release 33-8176 (Jan 2003) as Form 8-K **Item 12**; furnishing requirement applies to earnings releases made **after March 28, 2003** (Release 33-8216 interim guidance: file under Item 9 "Regulation FD Disclosure" with a cross-reference until EDGAR was reprogrammed; many 2003 filings say exactly that). Renumbered **Item 2.02** in the August 2004 8-K overhaul (effective Aug 23, 2004 — not confirmed by search; needs checking). Consequence for a parser: **for 2003-03-28 → 2004-08-22 you must match Item 9 / Item 12 text, not the `2.02` code.** | Effective date confirmed by SEC/Federal Register snippets; renumbering date needs checking. |
| Submissions JSON | `https://data.sec.gov/submissions/CIK##########.json` (10-digit zero-padded CIK): `filings.recent` arrays include `form`, `filingDate`, `acceptanceDateTime`, `items` (e.g. `"2.02,9.01"`), `accessionNumber`, `primaryDocument`; older filings paged via `filings.files[]` (`CIK##########-submissions-001.json`). Ticker→CIK map: `https://www.sec.gov/files/company_tickers.json`. | Field names from prior knowledge + third-party guides; not read this session. Needs one live call to confirm. |
| Fair access | SEC "Accessing EDGAR Data" (`https://www.sec.gov/os/accessing-edgar-data`): snippet text "Current max request rate: 10 requests/second" and "Please declare your user agent in request headers" (sample: company name + admin email); SEC developer page: "limit each user to a total of no more than 10 requests per second, regardless of the number of machines used". Missing/generic UA → 403. | Quoted from search snippets; page not read. |
| Before/after-market | **`acceptanceDateTime`** gives the EDGAR acceptance timestamp (e.g. `2025-09-23T16:02:28`). Earnings 8-Ks are typically furnished within minutes-to-hours of the press release, so acceptance before ~09:30 ET ⇒ pre-market, after ~16:00 ⇒ post-market. Not exact: some companies file hours later. **Filing-date trap:** EDGAR gives submissions accepted after **5:30 pm ET** a `filingDate` of the next business day (6:00 am), while `acceptanceDateTime` keeps the true time (SEC status page snippet; a 10-Q at 6:04 pm May 8 got filing date May 9). Use acceptance date, not filing date, for the event date. | Snippets; needs checking. |
| Full-text search | `https://efts.sec.gov/LATEST/search-index?q=...&forms=8-K` covers **2001→present** (several sources). Useful for pre-2003 Item 9/12 earnings 8-Ks but noisy. | Needs checking. |
| 10-Q/10-K as proxy (1993–2003) | Quarterly indexes `https://www.sec.gov/Archives/edgar/full-index/YYYY/QTRn/form.idx` exist from 1993 Q1 (electronic phase-in **April 26, 1993 → May 6, 1996**; most large filers electronic by 1993–94). The 10-Q filing date lags the earnings press release by days to weeks, so it is a poor stand-in for "earnings day" — flag it in the UI as "filing day", or don't offer per-stock earnings before 2003. | Phase-in dates from Federal Register snippet; `form.idx` from knowledge. |
| License | Public domain; SEC asks for fair access + UA. | — |

**Pre-2003 reality:** before Item 12, companies had no obligation to furnish earnings releases to EDGAR; many did not. There is no free, complete source of press-release dates for 1990–2002. Paid/academic: Compustat `rdq`, I/B/E/S (a 2009 Bristol paper argues many I/B/E/S "announcement dates" are not announcement dates — treat with caution), Wall Street Horizon archive **from 2006** (now TMX "Global Corporate Events").

### 5b. Existing free datasets/APIs

| Source | Depth / fields | Terms | Status |
|---|---|---|---|
| **PyPI `stocks-earnings-dates` 0.1.9** | SQLite `earnings.db`: **36,845 rows, 505 tickers (S&P 500 + "top 100 Nasdaq" per README), 2003-07-28 → 2025-11-20**, columns `Ticker, Earnings_Date` only — **no before/after flag, no CIK, no accession link**. Built from EDGAR 8-K Item 2.02 scraping; counts ramp 128 (2003) → ~1,950/yr. AAPL's first row is 2004-10-13 (so early years have gaps). README: "static dataset. Updates are not (yet) automated." | **`license: None` in PyPI metadata** — no stated license; cannot be redistributed safely. Use only as a cross-check for your own EDGAR build. | [v] all of this. |
| Alpha Vantage `EARNINGS` | `quarterlyEarnings[]` with `fiscalDateEnding`, `reportedDate`, `reportedEPS`, `estimatedEPS`, `surprise`; newer payloads include `reportTime` (pre/post-market) — field names from memory, unverified. History back to the 1990s for large caps in practice. Free key: **25 requests/day, 5/min** (several sources; was 500/day, then 100). `EARNINGS_CALENDAR` is CSV, forward-looking (3/6/12 months). | ToS (`https://alphavantage.co/terms_of_service`): grants a "non-exclusive, non-sublicensable, non-transferable, non-assignable, revocable license"; "legally binding agreement"; third-party note that a key "does not automatically grant display or redistribution rights". Economic-indicator endpoints bind you to FRED API terms. **Redistribution clause not read — must be read before committing AV output to a public repo.** 100 tickers at 25/day = 4+ days of pulls. | Snippets; needs checking. |
| Yahoo Finance via `yfinance` | `Ticker.get_earnings_dates(limit=12, offset=0)`; code raises `ValueError("Yahoo caps limit at 100")`; scrapes `finance.yahoo.com/calendar/earnings?symbol=`; docstring example shows rows back to 2013-08-01 (≈12 years / ~48 quarters, plus future). Columns: EPS Estimate, Reported EPS, Surprise(%); the Date index carries a timestamp that effectively encodes pre/post market. | Unofficial scraping; Yahoo ToS prohibit redistribution. Not defensible for a committed dataset. | [v] source read. |
| `yahoo-finance2` `quoteSummary` `earningsHistory` | Interface `EarningsHistory { history: EarningsHistoryHistory[] }` with `epsActual, epsEstimate, epsDifference, surprisePercent, quarter, period` — **no announcement date field**, and the array is 4 quarters (per task statement; count not visible in the type). `calendarEvents` gives next earnings date only. | Same Yahoo ToS issue. | [v] type definitions read; 4-quarter depth needs checking. |
| Nasdaq `api.nasdaq.com/api/calendar/earnings?date=YYYY-MM-DD` | Undocumented; no key; one date per call; fields include `time` ("time-pre-market" / "time-after-hours" / "time-not-supplied" — from memory). Historical depth unknown ("no revision history, update time, permanent event ID" per an Apify README). Would need ~250 calls/yr of trading days. | Undocumented endpoint; Nasdaq ToS not read. | Needs checking. |
| Finnhub `/calendar/earnings` | Pricing page lists "10 years and real-time updates" for the earnings calendar, but historical range on the **free** tier is widely reported as limited (the task's "1 month" figure was not confirmed either way). Free plan 60 calls/min "for personal use". | Personal use only on free tier. | Needs checking. |
| Financial Modeling Prep | Historical earnings calendar endpoints exist; free tier 250 calls/day (memory); third-party notes say earnings dates may be excluded on free tiers "because of upstream licensing". ToS generally prohibit redistribution. | Not read. | Needs checking. |
| EarningsWhispers, Zacks, Wall Street Horizon | Paid; WSH archive from 2006 with revision history ("DateBreaks"). | Paid. | — |
| Kaggle | Various one-off dumps (often Yahoo-scraped); none with a clear license and documented methodology surfaced. | Varies. | — |
| FirstRate Data | Paid; earnings 2000→, with a release-time field (BMO/AMC/during). | Paid. | Snippet. |

### 5c. Recommendation

- **Build from EDGAR, floor year 2003 (effectively Q2 2003 onward, so FY-quarter coverage is complete from 2004).** For each S&P 100 constituent (watch survivorship: use point-in-time membership — see §6), pull `submissions/CIK….json` + paged files, keep 8-Ks whose `items` contains `2.02` (2004-08-23→) or Item 9/12 earnings releases (2003-03-28→2004-08-22; detect via `primaryDocument` text or EX-99 title containing "results"), record `acceptanceDateTime` and derive `session: pre|regular|post` from the ET time. Rate-limit to ≤8 req/s with a proper `User-Agent`. Commit `earnings/{ticker}.json`.
- Cross-check against `stocks-earnings-dates` (do not redistribute it) and spot-check ~20 dates against company IR pages.
- Offer 1993–2002 only as "10-Q/10-K filing date" with an explicit UI caveat, or omit.
- Known noise: companies that file two 2.02 8-Ks per quarter (preliminary + final, or 8-K/A), fiscal-year-end 10-K earnings sometimes furnished without 2.02, spin-offs/mergers changing CIKs.

---

## 6. Options expiration and index events

| Event | Rule / source | Status |
|---|---|---|
| Monthly options expiration | Third Friday of each month; if that Friday is an exchange holiday (Good Friday in some years, e.g. 2015-04-03? — check), expiration is the **preceding Thursday**. Computable with the NYSE holiday calendar. (Before Feb 2015, "expiration" was technically the Saturday after the third Friday; the last trading day was the Friday — needs checking.) | Rule confirmed by several calendar sites; Good Friday handling confirmed; Saturday detail from memory. |
| Triple/quad witching | Third Friday of Mar/Jun/Sep/Dec (index futures, index options, stock options, since 2002 single-stock futures). Computable. | Confirmed. |
| S&P 500 quarterly rebalance | S&P DJI rebalances "after the close on the third Friday of March, June, September, December" (share/IWF updates and most scheduled constituent changes), **effective prior to the open of the following Monday**. The exact "effective prior to open" wording was found only for other S&P indices in search; confirm in the "S&P U.S. Indices Methodology" PDF on spglobal.com. Ad-hoc constituent changes happen anytime. | Needs checking. |
| S&P 500 constituent history | `fja05680/sp500` on GitHub [v README + `sp500_changes_since_2019.csv` (131 rows, `date,add,remove`)]: point-in-time membership **from 1996** (original list from Andreas Clenow's *Trading Evolved*, maintained via Wikipedia "Selected changes"); author warns the first ~5 years may be incomplete (487 symbols on the first row; ≥494 from 2001-01-16). No license file seen — needs checking. Official history is S&P DJI (paid). | [v] README/CSV read. |
| Russell reconstitution | Annual since 1989 (quarterly 1984–86, semi-annual 1987–88). Implemented after the close on the **fourth Friday in June** (FTSE Russell ground rules; the 2023 ground-rules history says the wording was kept). Whether pre-2004 used "last Friday" (June 30, 2000; June 29, 2001) was not confirmed — FTSE Russell "History of Ground Rule Updates" PDF should settle it. **From 2026 semi-annual:** Jan 16, 2025 announcement said second Friday in November; the Sept 1, 2026 announcement set the second 2026 reconstitution for **Dec 11, 2026** (preliminary lists Nov 13). Floor: need a hand-made table 1990→2025 (one date/yr) then rule. `https://www.lseg.com/en/ftse-russell/indices/russell-us/reconstitution` | Needs checking. |
| Dow component changes | Wikipedia "Historical components of the Dow Jones Industrial Average" (≈60 changes since 1896 per snippet; S&P DJI press releases are primary). ~15 changes since 1990; hand-made JSON. | Needs checking. |
| One-offs (hand-made JSON) | Black Monday 1987-10-19; Friday the 13th mini-crash 1989-10-13; 2010-05-06 flash crash; 2015-08-24 (ETF dislocations, 1,200+ LULD halts); 2018-02-05 (VIX spike); 2020 market-wide Level-1 circuit breakers **Mar 9, 12, 16, 18** (7% S&P drop, 15-min halts — confirmed; first MWCB trips since Oct 27, 1997); 2025 tariff episode: **Apr 2 announcement after close; Apr 3 S&P −4.8%; Apr 4 −6.0%; Apr 9 +9.5% on 90-day pause** (confirmed). | 2020 and 2025 dates confirmed by search; 1987/1989/1997/2010/2015/2018 from memory. |

---

## 7. Astronomical and odd calendars

| Calendar | Approach | Status |
|---|---|---|
| Full/new moons | **`astronomy-engine` npm 2.1.19, MIT, no deps, last published 2023-12-14** [v]. `SearchMoonQuarter(date)` then `NextMoonQuarter(mq)` enumerate quarters (`quarter` 0=new, 1=first, 2=full, 3=third); `SearchMoonPhase(lon,…)` for arbitrary phases; "Astronomy Engine performs its calculations in UTC using the AstroTime class, which does not contain timezone information" [v README]. Ran it: 12 full moons in 2024; **2 of 12 fall on a different calendar date in America/New_York than in UTC** (2024-06-22 01:08Z = Jun 21 21:08 ET; 2024-09-18 02:34Z = Sep 17 22:34 ET) [v]. **Decision needed:** define event date in ET (market's zone) and document it. Alternative/validation: USNO "Dates of Primary Phases of the Moon" `https://aa.usno.navy.mil/data/MoonPhases` (1700–2100, JSON via USNO API; times in UT). | [v] computed; USNO page not read. |
| Mercury retrograde | No library function, but trivially computable: geocentric apparent ecliptic longitude via `Ecliptic(GeoVector(Body.Mercury, t, true)).elon`, retrograde when decreasing. Ran it for 1990 [v]: stations at ~1990-04-23 / 05-17, 08-25 / 09-17, 12-15 / 1991-01-04 — matching the dates astrology sites publish (Apr 23–May 17, Aug 25–Sep 17, Dec 15–Jan 3/4). Refine station times with a bisection step; ~3 periods/yr, ~3 weeks each. No authoritative "source list" exists; compute and cite the ephemeris (astronomy-engine, VSOP87-based). | [v] |
| Solstices/equinoxes | `Seasons(year)` → `mar_equinox, jun_solstice, sep_equinox, dec_solstice` (UTC). 2024: Mar 20 03:06Z, Jun 20 20:50Z, Sep 22 12:43Z, Dec 21 09:20Z [v]. Same ET/UTC date-boundary caveat. | [v] |
| Friday the 13th | Pure calendar arithmetic. | — |
| Chinese New Year | Lunisolar; use a table or library (`lunar-dates` npm covers 1901-01-20 → 2100-12-01; `@unified-calendar/core`; or `Intl.DateTimeFormat('zh-u-ca-chinese')` via ICU to find month 1 day 1). | Snippets; not tested. |
| Ramadan | Hijri; Saudi **Umm al-Qura** is the standard tabular calendar (npm `@umalqura/core`, `hijri-core` which also supports FCNA/ISNA conventions). Actual observance varies ±1 day by country/moon sighting; use the Umm al-Qura date and say so. | Snippets. |
| US DST transitions | Rules: 1967–1986 last Sunday Apr → last Sunday Oct (Uniform Time Act; 1974–75 exceptions); **1987–2006 first Sunday Apr → last Sunday Oct**; **2007→ second Sunday Mar → first Sunday Nov** (Energy Policy Act 2005). tz database lines: `Rule US 1967 2006 - Oct lastSun`, `Rule US 1987 2006 - Apr Sun>=1`, `Rule US 2007 max - Mar Sun>=8`. Compute from the rules or detect offset changes via `Intl` in America/New_York. | Snippets consistent with knowledge. |
| Tax day | April 15, moved to next business day for weekends and **DC Emancipation Day (Apr 16, observed Fri Apr 15 when the 16th is Saturday)** — e.g. 2022-04-18, 2023-04-18; **2020-07-15**, **2021-05-17** (COVID). Rule + 2-row exception table. | Snippets. |
| Super Bowl Sunday / Monday after | Not computable (date drifts: Jan 15, 1967 → Feb 8, 2026). **nflverse `nfldata/data/games.csv`** on GitHub raw [v]: 27 `game_type == "SB"` rows, seasons 1999–2025 (2000-01-30 → 2026-02-08) with `gameday, weekday, gametime`. For 1990–1999 add ~10 rows by hand from Wikipedia "List of Super Bowl champions". nflverse data license needs checking (repo README). | [v] CSV read. |

---

## 8. Market holidays / early closes (covered elsewhere)

One canonical list worth naming: **`pandas_market_calendars`** (PyPI 5.6.0, MIT) [v] — `holidays/nyse.py` (1,535 lines) encodes NYSE full closures and early closes back to the 19th century, including ad-hoc closures (e.g. 2001-09-11..14, Hurricane Sandy 2012, presidential funerals), the 1pm day-after-Thanksgiving close since 1993 (2pm before), Christmas-Eve rules, and 2013-07-03 [v]. Its header cites as "main reference" a PDF `Stocks.NYSE-Closings.pdf` attached to a GitHub issue (`github.com/rsheftel/pandas_market_calendars/files/6827110/Stocks.NYSE-Closings.pdf`) [v]. The JS equivalent would be to port the 1990→ subset or generate a JSON once from the Python package.

---

## 9. Recommendations per event type

| Event | Source | Build fetch | Floor | Open questions |
|---|---|---|---|---|
| FOMC meeting | Board per-year HTML `fomchistoricalYYYY.htm` + `fomccalendars.htm`; validate against DFEDTAR change dates | Scrape HTML → `fomc.json` `{start,end,type,statement_time,press_conf}`; ~8–12 rows/yr | 1990 (dates); statement times meaningful from 1994; 2:00 pm from 2013-03-20 | "Day of" = `end` for two-day meetings? 2:00/2:15 pm announcement vs. close-price buy: same-day close is *after* the announcement (treat as post-event), open is pre-event. Unscheduled calls with no rate change: include? |
| Fed funds target | FRED `DFEDTAR`, `DFEDTARU/L` via `fredgraph.csv` (not the API, given the caching clause) | Daily CSV → change dates | 1982 | Verify FRED terms permit committing the file; cite. |
| Jobs report | BLS `histreleasedates.pdf` (1957–2000) + `schedule/YYYY/home.htm` (1999→); or ALFRED `rid=50` download | PDF parse once + yearly HTML scrape; or one ALFRED text file | 1990 easily; 1957 possible | Confirm ALFRED list is release dates not vintages; 2025 missing-October handling (event with no release). |
| CPI / PPI / JOLTS | Same BLS PDF(s) + yearly pages; PPI PDF 1971–2025; JOLTS yearly pages | Same | CPI 1990; PPI 1990; JOLTS 2002-07 | — |
| GDP advance / PCE | BEA yearly schedule pages (UNT archive for 2012–2017, SCB for 2020→) or ALFRED | Scrape/hand-merge | 1990s via ALFRED (verify) | 8:30 am releases are pre-open: buy at open is post-event. |
| Retail sales | Census `martsdates.pdf` archive copies or ALFRED | — | 1990s via ALFRED (verify) | — |
| ISM PMI | Rule: first business day, 10:00 am | Compute | Any | ISM is private; dates are facts. |
| UMich sentiment | ALFRED release dates or SCA schedule | — | Verify | Prelim vs final as two event types. |
| Conference Board | Rule: last Tuesday, 10:00 am | Compute + exceptions | Any (approx.) | No free historical list; label as approximate. |
| Weekly claims | Rule: Thursday 8:30, Wed on holidays; DOL archive for exceptions | Compute + ALFRED check | Any | Low value as a DCA trigger (weekly). |
| Treasury refunding | Treasury "Official Remarks by Calendar Year" | Scrape dates | 1990 (remarks from 1982) | — |
| Humphrey-Hawkins | `mpr_default.htm` (1996→) + FRASER hearings (1979→) | Scrape | 1990 | Two days per report (Senate/House). |
| Jackson Hole | KC Fed archive / EconPapers dates | Hand table | 1982 | Which day: Chair speech (Fri). |
| Stress tests | Board press releases | Hand table | 2009 | 4:30 pm release → next-day open is first tradeable. |
| Beige Book | Board per-year pages / Minneapolis Fed archive | Scrape | 1990 (public since 1983) | — |
| Elections | Statute rule + 10-row "called" table | Compute | Any | Day after election: results often unknown (2000, 2020). |
| Shutdowns / debt ceiling | CRS RS20348, R43389, IN12045 | Hand JSON | 1976 / 1995 | Start-day convention. |
| Earnings per stock | SEC EDGAR submissions JSON, Item 2.02 (and Item 9/12 for 2003–04) | Rate-limited fetch per CIK, derive session from `acceptanceDateTime` | **2003-03-28** (full quarters from 2004) | Pre-2003: omit or label as 10-Q filing date. Survivorship: use point-in-time S&P membership (fja05680 from 1996). Which session: pre-market → same-day open is post-event; post-market → next-day open. |
| Options expiry / witching / S&P rebalance | Rules + NYSE holiday list | Compute | Any | Pre-2015 Saturday expiration semantics. |
| Russell reconstitution | FTSE Russell + hand table | Hand JSON 1990–2025, rule after | 1990 | Pre-2004 rule; 2026 December date. |
| Dow/S&P constituent changes | Wikipedia / fja05680 / S&P DJI releases | Hand JSON / CSV | 1996 (S&P PIT); 1990 (Dow) | License of fja05680 data unclear. |
| Moons, seasons, Mercury retrograde | `astronomy-engine` (MIT), computed at build | Compute | Any | **Date boundary: compute in America/New_York, not UTC** (2/12 full moons differ in 2024). |
| DST, tax day, Friday 13th, Chinese NY, Ramadan | Rules / `lunar-dates` / `@umalqura/core` | Compute + small exception tables | Any | Ramadan ±1 day observance. |
| Super Bowl | nflverse `games.csv` (1999→) + hand rows 1990–98 | Fetch CSV, filter `SB` | 1990 | nflverse license. |

### Cross-cutting open questions for the spec

1. **Session semantics.** Every event needs a `time_et` (or `session: pre|regular|post|closed_day`) so the backtester can map "buy on the day of X" to the correct bar: 8:30 am releases → that day's open is the first post-event price; 2:00 pm FOMC → that day's close is post-event, open is pre-event; 4:30 pm stress tests / post-market earnings → next session. Define "the day after" relative to trading days, not calendar days (weekend FOMC emergency cuts; Sunday Mar 15, 2020).
2. **Two-day FOMC meetings:** store both dates; default "meeting day" = announcement (last) day; expose "first day of meeting" as a separate anchor.
3. **Missing events** (Oct 2025 jobs report never published; Sept 2025 JOLTS cancelled): represent as scheduled-but-not-released so a "jobs report day" schedule doesn't silently skip a month, or document that it does.
4. **Licensing to confirm before committing files:** FRED API no-caching clause (use web CSV instead); Alpha Vantage redistribution; `stocks-earnings-dates` has no license (don't ship it); fja05680 and nflverse licenses; ISM/Conference Board (rule-derived dates only, no index values).
5. **Verification debt:** every primary-agency URL above was blocked from this sandbox; the first build task should be a smoke script that fetches each and asserts the expected table shape, so the spec's floor years are confirmed by data rather than by this report.
