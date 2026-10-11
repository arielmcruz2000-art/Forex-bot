# 60-pip target execution-cost stress and financing sensitivity

Recorded 2026-10-11 UTC. This continues the predeclared validation of the 60-pip target; no new entry/exit parameters were optimized.

## Execution-cost backtest

Separate source `forex-sma-short-target60-cost-m15.pine` was saved privately and compiled in TradingView as `Forex Bot EURUSD M15 Target 60 Cost Stress v0.5`. Feed OANDA:EURUSD, standard M15, visible interval June 30–October 9, 2026, same already-inspected development sample. Initial capital USD 1000, 1% risk, one position, short-only SMA 5/20, weekday New York 07:00–12:00 signal-close session, stop 20 pips and target 60 pips.

Commission/spread proxy doubled to 0.0001 USD per unit per side (two pips round trip) and market/stop slippage to two minimum ticks. Risk-per-unit sizing buffer changed consistently to 0.0002 + four minimum ticks. Properties visibly confirmed USD 1000, 0.0001 per-contract commission, two ticks slippage, on-bar-close execution, one-tick delay and illustrative 50:1 margin. Legend confirmed risk 1, Session, stop 20 and ratio 3.

| Metric | Original execution costs | Doubled execution costs |
| --- | ---: | ---: |
| Total PnL | +121.25 USD / +12.13% | +101.04 USD / +10.10% |
| Max equity drawdown | 70.70 USD / 6.83% | 71.72 USD / 6.95% |
| Closed trades | 26 | 26 |
| Winners | 10 / 38.46% | 10 / 38.46% |
| Profit factor | 1.749 | 1.631 |
| Report expectancy | 4.66 USD | 3.89 USD |

Stressed gross profit 261.24 USD, gross loss 160.20 USD, all PnL under Short. All 26 closed rows, IDs 1–26, were transcribed from the visible UI to `short-target60-cost-observed-rows.json`; no additional open row and protective levels empty. Rounded rows total 101.05 USD versus report 101.04 USD, a one-cent rounding difference. Reduced sizing is part of the comparison. This specific execution stress reduces the gain by 20.21 USD, approximately 16.7%.

## Hypothetical financing sensitivity, not a broker tariff

Financing is NOT in the TradingView backtest above. To estimate sensitivity on its captured trade ledger, apply a constant hypothetical debit in pips per elapsed calendar day, prorated continuously to every trade:

`estimated debit = sum(rounded displayed units * elapsed hours / 24) * 0.0001 * assumed pips per day`

Rounded units from the visible K notation produce approximately 229,188.54 unit-calendar-days, or 22.91885 USD per assumed one pip/day. Source calculated values: `short-target60-financing-sensitivity.json`.

| Hypothetical debit, pips/calendar-day | Estimated total debit | Report PnL less estimated debit |
| --- | ---: | ---: |
| 0.1 | 2.29 USD | +98.75 USD |
| 0.5 | 11.46 USD | +89.58 USD |
| 1.0 | 22.92 USD | +78.12 USD |
| 2.0 | 45.84 USD | +55.20 USD |
| 3.0 | 68.76 USD | +32.28 USD |
| 4.0 | 91.68 USD | +9.36 USD |

Arithmetic break-even is about 4.41 assumed pips per elapsed calendar day for this fixed ledger. It is not a forecast or a safe cost threshold. These are illustrative assumptions, NOT observed/quoted OANDA financing rates. Real credits/debits, rollover timing, holiday/weekend multiples and changing rates are not modeled. This is a post-hoc deduction with unchanged quantities and entries; it does not recalculate equity, future sizing, daily lock, drawdown or eligible trades. An integrated financing backtest can differ. It therefore cannot establish a net-live profit or a financed drawdown.

## Decision

The 60-pip development result remains positive under the tested execution stress and the illustrative carrying scenarios. The same window has been used for strategy selection repeatedly; independent evidence is still absent. Keep this candidate frozen for evaluation on an untouched period or new forward paper data. Do not interpret these three-month totals as monthly income. No Netlify engine change, alerts, webhooks, OANDA connection or real orders were made.
