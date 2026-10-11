# Short-only session diagnostic — 2026-10-11 UTC

## Scope and reproducibility

Predeclared after the full Session audit: remove long entries, retain the weekday New York 07:00–12:00 signal-close entry window. The separate `forex-sma-short-session-m15.pine` was saved privately and compiled successfully in TradingView as `Forex Bot | EURUSD M15 | Short Session Test v0.4`. No alerts, broker connections or real orders were created. The Netlify generated-price engine was not changed.

Feed: OANDA:EURUSD, standard M15 candles, chart timezone UTC. Visible available report interval: June 30–October 9, 2026, matching the prior development window. Script inputs allow 2024–2027, but do not create additional available history. Retained initial capital USD 1000, 1% equity risk, SMA 5/20, one position, 20-pip stop, 40-pip gross target, fixed spread proxy one pip round trip, one minimum tick slippage and illustrative 2% margin. Session is the default filter in this diagnostic; ATR is unused. Only title, default filter and long-entry removal differ from the parent script.

## Observed result

| Metric | Session, both sides | Short-only Session |
| --- | ---: | ---: |
| Total PnL | -48.53 USD / -4.85% | +58.58 USD / +5.86% |
| Max equity drawdown | 126.10 USD / 12.18% | 70.93 USD / 6.92% |
| Closed trades | 47 | 31 |
| Winners | 15 / 31.91% | 13 / 41.94% |
| Profit factor | 0.846 | 1.327 |

The report lists all profit under Short, with gross profit 237.58 USD, gross loss 179.00 USD and expectancy 1.89 USD per trade. All 31 displayed closed trade rows were captured from the visible table, IDs 1–31, in `short-session-observed-rows.json`. There was no additional open row; chart protective levels were empty. Rounded rows sum to +58.56 USD versus +58.58 USD in the report, a two-cent rounding difference. Maximum closed-trade losing streak remains seven (#7–13). This is a sample statistic, not a guaranteed future bound.

The 31 trades differ from the previous audit's 17 short trades: removing longs frees otherwise occupied time and changes equity/sizing. The previous short subtotal of +52.18 USD therefore was not the independent strategy result.

## Interpretation and remaining validation

This is a positive development diagnostic, not an untouched out-of-sample evaluation. Direction was chosen after observing the same development sample, and several prior filters were tested. The result is exposed to selection bias and a short, low-trade-count window. The market declined over much of this interval; do not infer performance in other regimes or project monthly income.

Holding through nights and weekends is still permitted, and swap is still omitted. A stop is not a guaranteed loss cap. Higher spread/slippage and financing can materially reduce this modest edge. No cost stress or independent-period test was run in this step.

Next: freeze this version, test higher execution costs with the sizing buffer changed consistently, then evaluate a separate untouched interval if available. If historical access is insufficient, record forward paper signals on new data before integration. Do not tune settings from the reserved evaluation sample. OANDA remains disconnected.
