---
name: usage-meter-check
description: Check whether a Claude plan usage limit (weekly, per-model like Fable) now charges more per token or per message than in past weeks. Use when a limit seems to drain faster than usual.
---

Goal: one table, one week per row, and one multiplier. The multiplier is how much more meter each unit of work costs now than in a past week with a known reading.

1. **Week boundary.** Read the limit's reset time from Claude Code's `/usage` (or the desktop app's usage card). Every week starts at that weekday and time.
2. **Meter readings.** You need at least two: the current percent from `/usage`, plus a past one. The best past reading is a limit hit: search the transcripts for an assistant message whose text contains `reached your` and `limit`. That timestamp is 100%. On macOS, the desktop app also keeps sparse samples of the weekly meter in `~/Library/Application Support/Claude/plan-usage-history.json`.
3. **Usage.** Read every `~/.claude/projects/**/*.jsonl`, subagent folders included. For each `assistant` line with `message.usage` and the limit's model:
   - Dedupe on `(message.id, requestId)`. One response can span several lines.
   - Weighted tokens = input + 1.25 × 5-minute cache writes + 2 × 1-hour cache writes + 0.1 × cache reads + 5 × output. The write split is in `usage.cache_creation`.
4. **Messages.** Count `user` lines where `origin.kind == "human"`. Dedupe on `uuid`, because forked and branched sessions copy earlier lines into a new file under the same uuid.
5. **Count each request once.** A harness that drives Claude Code through the Agent SDK (its lines say `"entrypoint": "sdk-ts"`) may also log the same requests in its own store. Use the transcripts. Usage from claude.ai chat, mobile, and cloud sessions never reaches this disk, so say so in the report.
6. **Compute.** For each meter reading, divide the meter percent by the weighted tokens and by the messages in the same window. The multiplier is the current ratio over the past one. Also show weighted tokens per message for every week. If that number stayed flat while the multiplier rose, the meter changed, not the user.

Report a weekly table with these columns: sessions, messages, requests, input, cache write, cache read, output, weighted, and meter reading. Then give the multiplier per message and per weighted token, and say which weeks the readings came from.
