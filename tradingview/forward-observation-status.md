# Future market-data observation — configured October 11, 2026

The saved TradingView chart https://www.tradingview.com/chart/HPTKHNy5/ has the frozen Short Target 60 Cost Stress v0.5 candidate configured for Test start October 12, 2026 00:00 UTC and Test end December 12, 2026 00:00 UTC. The end excludes Saturday and permits weekday entries through December 11. Final positions must be reported separately: the script's date-end close requires a later market bar and may not fill until the next opening. Do not assume every position has closed by Friday.

Source SHA256 and all strategy parameters remain unchanged from independent-validation-plan.json. Saved inputs were re-opened and verified, and commission 0.0001 USD per unit per side, slippage 2 ticks, leverage 50x and bar-close evaluation were inspected. The chart also retains the original historical Research v0.1 baseline. It can become the selected report on reload: explicitly select the v0.5 candidate before recording anything. Its prior +101.04 USD development profit is not the starting balance or profit of this study.

The candidate report now shows “This report requires trade data”. No future trade exists yet. October 11 is Sunday; eligible signal closes begin Monday October 12 at 07:00 America/New_York, subject to the SMA crossover. No trade is guaranteed each day.

## Enabled observation and remaining limits

A ChatGPT weekday evening observation task was successfully created and enabled on October 11, beginning October 12 and ending December 11 in America/New_York. It reads the saved chart, verifies the frozen settings, records visible metrics and trade rows in the two JSONL ledgers, and reports in Spanish. This is scheduled inspection of TradingView's broker emulator using market data, not an always-running execution server or a continuously captured realtime fill log. Future browser authentication or access failures must be recorded as blocked/unknown.

Creating a native strategy order-fill alert was attempted. TradingView showed “Alert saving failed” and “limit of 0 technical alerts” on Basic. No native alert, webhook, broker connection or order routing was created, and no paid plan was purchased. Reliable server-side realtime signal capture remains blocked under the current plan.

Basic also limits chart history to 5,000 bars. This is shorter than the full proposed study when M15 bars accumulate. Each observation must check that the loaded bars still include October 12 and sufficient earlier SMA20 warmup. If they do not, flag history-incomplete and stop presenting partial recalculation as cumulative results. Preserve earlier observations; do not silently reset equity or stitch overlapping/partial backtests. The final whole-window result may require permitted full-history access. Extending observation or changing the dataset requires an explicit new study protocol.

## Evidence ledger

forward-observations.jsonl contains dated snapshots with source, completeness and access state. forward-trades.jsonl contains only actual visible emulator trade rows from this window; it begins empty. Deduplicate by candidate, trade number and entry/exit timestamps, preserving revisions. Record source market-data and fill model TradingView-broker-emulator-recalculated. Separate closed profit, open profit, costs, equity drawdown and sample size. Undefined profit factor or inaccessible metrics remain null. Financing is not modeled; emulator profitability is not broker profitability.

No artificial Netlify result enters either ledger. The private Netlify site redirected to invited-account login during this setup; its running state is unverified until access succeeds. OANDA remains disconnected and real-money execution disabled. The OANDA:EURUSD chart label identifies a data feed only.
