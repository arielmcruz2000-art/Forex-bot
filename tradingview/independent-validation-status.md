# Independent validation attempt — 2026-10-11

## Frozen candidate

`forex-sma-short-target60-cost-m15.pine` is the selected candidate, not the original two-direction 40-pip baseline. Exact parameters and source checksum are recorded in `independent-validation-plan.json`. No Pine source, entry/exit rule, risk input, execution property, broker connection or Netlify strategy was changed in this attempt.

Freeze means evaluate this exact candidate without selecting new parameters using the validation result. Any strategy modification starts a new candidate and requires a new unused validation window. The already-inspected June 30–October 9 window remains development data. Subdividing it after inspection does not make it out of sample.

## Attempt and concrete blocker

The signed-in TradingView chart was opened on OANDA:EURUSD, standard M15. The active selected cost-stress report still showed the development metrics: +101.04 USD, 26 closed trades, profit factor 1.631, max equity drawdown 6.95%. These are existing development results, not a new independent test.

An earlier March 2–June 26, 2026 interval was reserved for this validation attempt. In Strategy Report, Custom date range opened a Deep Backtesting upgrade notice stating Basic can calculate only data loaded on the chart. The regular chart Go to control was then used for March 2, 2026 to check permitted history access. It stopped at the earliest available June/July bars and displayed the Basic 5,000-bar history limit and upgrade requirement. The displayed strategy report stayed June 30–October 9. No March backtest, new trade ledger, independent performance statistic or successful validation is claimed.

No subscription/trial was purchased or activated, and no paywall was bypassed. No alternate feed, larger timeframe or artificial series was substituted: those would change the test. OANDA remains disconnected; an OANDA chart feed is data access, not an account connection.

## Continuation protocol

If permitted history becomes available, use the frozen candidate on March 2–June 26 without tuning. Load enough earlier bars to warm up SMA 20. Restrict entry dates to this window and require closure after its end using the next available bar; inspect/record any final open position. Record the actual loaded history, exchange/feed timezone and the New York signal session, script checksum, inputs, commission/slippage properties, leverage, execution cadence and fill assumptions.

Evaluate closed and open P/L separately, trade ledger, costs, daily locks, drawdown, profit factor, expectancy, both margin/exposure behavior and gaps. Do not call a small positive sample validated. The doubled-cost script includes spread/commission and execution slippage proxies but excludes actual financing; the existing hypothetical carrying sensitivity is a post-hoc illustration and does not recompute equity or future sizing.

A free future-data alternative is predeclared observation from October 12 through December 11, 2026, using the same candidate. This is a PROPOSED window, not an active service: no alert, webhook, scheduled capture, automatic TradingView Paper Trading order or broker execution was created. Historical strategy recalculation on later bars can be inspected manually; reliably recording realtime signals requires a separate setup and ledger. Extend observation if the sample remains too small; do not optimize on these data and continue calling them untouched.

No real-money integration may be inferred from this freeze or blocked test. The generated-paper ledger remains separate and supplies no independent market evidence.
