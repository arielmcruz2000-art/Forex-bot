# TradingView research stage

This is a baseline to test, not a validated or profitable strategy. OANDA is disconnected. The Netlify dashboard still runs generated prices; this script does not connect the two systems.

## Load the script

1. Sign in to your TradingView account and open Supercharts.
2. Select a standard Forex EUR/USD feed and 15-minute candles. Record the exact feed name (for example OANDA:EURUSD if available); choosing its chart does not connect an OANDA account.
3. Open Pine Editor, create a new strategy, replace its content with forex-sma-m15.pine, save and Add to chart.
4. Inspect the strategy report. Initial capital: USD 1000, risk: 1%, max one position, no pyramiding. The script rejects other pairs, timeframes and synthetic charts.
5. Keep strategy properties consistent: USD account, 0.00005 USD per unit per side commission proxy, one tick slippage, 2% margin, standard fill timing. Changing the properties can invalidate sizing assumptions.

The baseline compiled and ran in TradingView on 2026-10-11 UTC. The first observed historical report was negative; see [validation.md](validation.md) for the exact sample and metrics. There is no local Pine compiler in this repository. Available history and export/alert features depend on the account plan and feed.

## Exact baseline

The first separate trend-filter experiment is recorded in [trend-validation.md](trend-validation.md). SMA trend lengths 80, 100 and 120 all lost money and did not improve profitability in the development window. The original baseline remains unchanged.

Independent Session and ATR experiments are recorded in [session-atr-validation.md](session-atr-validation.md). Both improved headline loss in the development window but remained unprofitable; neither is deployed to the Netlify engine or validated out of sample.

The full [Session trade audit](session-audit.md) reconciles all 47 closed trades and identifies the long/short imbalance, holding durations and a gap beyond the nominal stop. The independent [short-only session diagnostic](short-session-validation.md) subsequently showed a positive development result, but remains unvalidated outside this sample. A separate [doubled-cost stress test](short-cost-validation.md) stayed positive with lower gains; an independent-period evaluation is still pending. A [60-pip target diagnostic](short-target60-validation.md) improved development PnL further but extended holding duration; its [execution-cost stress and hypothetical financing sensitivity](short-target60-cost-validation.md) stayed positive under the tested assumptions. Independent validation remains pending.

- Buy: SMA 5 crosses above SMA 20 at a confirmed M15 close; sell: opposite crossover. No future bars or external security() series.
- Entry: simulated market fill on the next bar open, not the signal close.
- Stop: 20 pips from simulated entry. Gross target: 40 pips. Costs make the net reward/risk lower than 2:1.
- Quantity: account equity × risk / (stop distance + fixed cost/slippage buffer). Quantity is units, not lots. One position at a time; no automatic reversals. This initial TradingView version deliberately tests one position (the Netlify engine permits up to two within its 2% budget).
- Daily lock: at least 4% loss relative to previous close equity at NY day transition, checked at bar closes. Once locked, entries stay blocked until next NY day. Stops/targets remain active. It does not guarantee losses stay below 4%, especially with gaps and intrabar changes.
- Margin model: illustrative 50:1 with reserve; it does not establish broker eligibility, availability or actual execution rules.
- Fixed commission approximates spread; no dynamic bid/ask, swap, liquidity, realistic partial fills or every real cost. TradingView's OHLC emulator can be ambiguous if a bar touches both stop and target; use more granular inspection/Bar Magnifier if your plan supports it.
- Test dates are adjustable. At the end it cancels pending entries and requests closure of remaining positions; the final closure needs a later available bar under default fill timing.

## Validation before integration

Run the unchanged baseline on a development period first; reserve a later untouched period for out-of-sample evaluation. Record feed, timeframe, test dates, properties, trade count, net P/L, max equity drawdown, profit factor, average trade, and long/short results. Compare nearby SMA lengths and higher costs without selecting parameters based on the reserved period. Low trade counts and good isolated results are insufficient.

Do not choose a strategy because it reaches a monthly income target. There is no justified earnings projection yet.

## Alerts later

Pine strategies simulate fills in TradingView's strategy emulator. They do not automatically operate the separate TradingView Paper Trading account or a brokerage account.

Order-fill alerts can be tested in TradingView first, using {{strategy.order.alert_message}} in the alert message. Alerts run on realtime events, not by replaying the historical report. Recreate alerts after changing script inputs.

Do not set our existing private /api/command URL as a webhook: it requires verified Netlify login and same-origin requests, and accepts generated-paper controls only. A dedicated authenticated receiver, duplicate/stale event handling and a distinct market-paper ledger remain to be implemented. No webhook credentials have been created or published. OANDA practice execution comes last.

## Primary references

- https://www.tradingview.com/pine-script-docs/concepts/strategies/
- https://www.tradingview.com/pine-script-docs/faq/strategies/
- https://www.tradingview.com/pine-script-docs/concepts/alerts/
- https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/
