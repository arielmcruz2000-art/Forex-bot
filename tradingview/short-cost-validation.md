# Short-only session cost stress — 2026-10-11 UTC

## Setup

A separate private Pine copy compiled and ran successfully in TradingView. Source: `forex-sma-short-cost-stress-m15.pine`. Feed OANDA:EURUSD, standard M15 candles, available report June 30–October 9, 2026. Same development window as the direction test, not an independent validation interval.

Only title and execution-cost assumptions changed from the short-only session diagnostic. Fixed spread proxy doubled from 0.00005 to 0.0001 USD per unit per side (one to two pips round trip). Market/stop slippage doubled from one to two minimum ticks. Risk-per-unit sizing buffer changed consistently from 0.0001 + 2 minimum ticks to 0.0002 + 4 minimum ticks, preserving the 1% budget rather than increasing the planned exposure. Stop remains 20 pips, gross target 40, SMA 5/20, weekday New York 07:00–12:00 signal-close session, initial capital USD 1000, one position and illustrative 2% margin.

TradingView Properties visibly confirmed commission 0.0001 per contract and slippage 2 ticks, USD 1000 initial capital, on-bar-close execution and one-tick delay. Inputs visibly confirmed 1% risk, Session, SMA 5/20, stop 20 and reward ratio 2. Script date bounds remain 2024–2027; actual available data are limited to the report interval.

## Observed results

| Metric | Original costs | Doubled costs |
| --- | ---: | ---: |
| Total PnL | +58.58 USD / +5.86% | +40.19 USD / +4.02% |
| Max equity drawdown | 70.93 USD / 6.92% | 72.74 USD / 7.13% |
| Closed trades | 31 | 31 |
| Winners | 13 / 41.94% | 13 / 41.94% |
| Profit factor | 1.327 | 1.227 |
| Report expectancy | 1.89 USD | 1.30 USD |

The stressed report shows gross profit 217.34 USD and gross loss 177.15 USD, with all PnL under Short. Chart protective levels were empty. The full stressed trade ledger was not separately transcribed in this step; headline metrics are direct visible report observations.

## Decision

The positive development result survived this specific doubled-cost scenario, with an 18.39 USD (approximately 31.4%) reduction in gain. Reduced quantities are part of this comparison; it is not a fixed-position pure fee subtraction. This supports continuing research, not deployment or an earnings forecast. It does not cover dynamic spreads, financing/swap, liquidity, all gaps, or more severe costs. Several hypotheses have already been selected on this window.

Keep the original short-session version frozen. Next evaluate a separate untouched interval without tuning from that interval; if historical access does not provide one, use new forward paper data. No independent period was tested here. No alert, webhook, real trade or OANDA connection was created, and the Netlify generated-price engine was unchanged.
