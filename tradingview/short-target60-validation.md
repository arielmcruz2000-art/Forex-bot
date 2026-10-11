# Short-session 60-pip target diagnostic — 2026-10-11 UTC

## Predeclared hypothesis

In response to the request to improve gains, test one exit change: raise the gross target from 40 to 60 pips while retaining the 20-pip stop, 1% risk, short-only SMA 5/20 and weekday New York 07:00–12:00 signal-close session. No target grid was searched in this step. The separate source `forex-sma-short-target60-m15.pine` changes only the strategy title and default reward ratio (2 to 3) from the original short-session script.

Compiled and saved privately in TradingView as `Forex Bot EURUSD M15 Short Target 60 v0.5`. Feed OANDA:EURUSD, standard M15 candles, available development window June 30–October 9, 2026. Initial capital USD 1000. The chart legend confirmed risk 1, SMA 5/20, Session, stop 20 and ratio 3. Properties visibly confirmed original commission 0.00005 USD per contract per side, one tick slippage, on-bar-close calculation, one-tick execution delay and illustrative 50:1 margin. This is not a broker connection.

## Observed comparison, original costs

| Metric | 40-pip target | 60-pip target |
| --- | ---: | ---: |
| Total PnL | +58.58 USD / +5.86% | +121.25 USD / +12.13% |
| Max equity drawdown | 70.93 USD / 6.92% | 70.70 USD / 6.83% |
| Closed trades | 31 | 26 |
| Winners | 13 / 41.94% | 10 / 38.46% |
| Profit factor | 1.327 | 1.749 |
| Report expectancy | 1.89 USD | 4.66 USD |
| Median holding hours | 18.75 | 22.5 |
| Maximum holding hours | 112.5 | 228.5 |
| Trades longer than 24 hours | 13 | 12 |
| Max closed losing streak | 7 | 6 |

The 60-pip report shows gross profit 283.09 USD and gross loss 161.84 USD, all under Short. All 26 closed rows, IDs 1–26, were transcribed from the visible table to `short-target60-observed-rows.json`. Rounded rows sum to +121.26 USD versus +121.25 USD in the report, a one-cent rounding difference. There was no additional open row and protective levels were empty. Longer holding changes eligible entries; the trade sets are not identical.

## Interpretation and remaining work

The larger target improved gain in this development sample without increasing the configured risk percentage or stop distance. It also lowered the winning percentage and materially extended the longest hold to about 9.5 days. Financing/swap remains absent, making that hold particularly relevant. The six-loss streak is observed, not a future bound; nominal stops do not guarantee losses during gaps.

This experiment and previous hypotheses all use the same inspected window. It is not independent confirmation, and the higher result must not be converted into a monthly income projection. The original 40-pip version remains preserved. The positive doubled-cost result recorded earlier applies ONLY to the 40-pip version, not to this 60-pip version.

Next validation: separately test 60 pips under higher execution costs with consistent risk sizing, assess financing sensitivity, then evaluate an untouched interval or new forward paper data without tuning on it. Those checks were not completed in this step. No Netlify engine change, alert, webhook, OANDA connection or real order was made.
