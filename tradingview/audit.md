# Baseline trade audit — 2026-10-11 UTC

Scope: unchanged EUR/USD M15 SMA 5/20 baseline, the June 30–October 9, 2026 report. All figures refer to simulation. No orders, alerts or broker connection were activated.

## Evidence and method

TradingView Basic required an upgrade for CSV export. No upgrade was purchased. The visible List of Trades was read by scrolling the table, capturing each rendered row and deduplicating by trade number. All identifiers 1–59 were present: 58 closed trades plus open short #59. The raw UI transcription is `audit-observed-rows.json`; it is not an official CSV export. Quantities and PnL values shown in the table are rounded. Chart timezone was UTC.

## Closed-trade sums from rounded table values

| Side | Closed trades | Winners | Losers | Net PnL | Profit factor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Long | 35 | 9 | 26 | -91.76 USD | 0.640 |
| Short | 23 | 8 | 15 | -3.18 USD | 0.979 |
| Total | 58 | 17 | 41 | -94.94 USD | 0.767 |

The short side alone was also negative on closed trades. The summary's positive short contribution includes an open trade and must not be interpreted as a profitable closed-trade system.

Average closed winner: 18.36 USD. Average closed loser: 9.93 USD. The observed payoff ratio implies approximately 35.10% winners to break even at these average dollar amounts; actual winners were 29.31%. This is descriptive arithmetic, not a stable forecast.

## Loss pattern

- Long trades contributed about 96.65% of the rounded closed-trade net loss.
- Trades #37–54 formed 18 consecutive losses, totaling 175.61 USD. Trade #37 was short; #38–54 were 17 consecutive long losses. The sequence ran from an entry on September 4 to the last exit on October 5, 2026.
- Every losing trade's displayed fill-to-fill price change was -20.1 pips. Sixteen winners moved +40 pips; one moved +41 pips. This is consistent with the configured brackets and slippage. It does not independently verify the intrabar order path.
- Repeated long entry prices declined through the losing sequence. This supports testing a trend filter; it does not establish that any particular filter will improve future results.
- Trades sometimes remained open across nights and weekends. Swap is absent from this baseline, so execution costs are incomplete.

| Exit month | Closed trades | Net PnL from rounded rows |
| --- | ---: | ---: |
| July | 23 | +54.10 USD |
| August | 11 | -26.36 USD |
| September | 16 | -101.12 USD |
| October through October 9 | 8 | -21.56 USD |

Grouping by exit month assigns each whole trade to its exit date; these are not mark-to-market monthly equity returns.

## Costs and reconciliation limits

The fixed commission proxy is about 27.29 USD across closed trades, estimated from rounded quantities. Adding only that proxy back to the rounded closed PnL still leaves about -67.65 USD, holding quantities and fills fixed. Thus the configured commission alone does not explain the loss. This arithmetic is not a zero-cost rerun; different costs change equity, sizing and possibly later entries. Real spreads, swap and gaps can worsen outcomes.

Open short #59 displayed +9.78 USD, while the headline Total PnL displayed -84.94 USD. Summing the rounded closed rows and that open row gives -85.16 USD, a 0.22 USD difference from the headline. The open entry's commission is approximately 0.21 USD using the rounded quantity. Commission treatment and rounding may explain this, but the discrepancy has not been fully reconciled from a full-precision export. Keep the headline, closed-row sum and open-row value distinct. The prior summary's gross loss and long/short blocks also should not replace the explicit closed-row sums.

## Next experiment, specified before results

Keep the current baseline and risk at 1%. Test one change first: allow longs only when price is above SMA 100 and that SMA is rising over five confirmed bars; allow shorts only below a falling SMA 100. Keep the SMA 5/20 entry, 20-pip stop, 40-pip target, one-position rule and fill timing unchanged.

Compare unchanged baseline versus that variant on this development sample: closed PnL, trade count, drawdown, profit factor, losing streak and each side. Inspect nearby trend lengths 80 and 120 for sensitivity rather than choosing the best isolated number. Repeat with a 2-pip spread proxy and higher slippage. A new untouched time period is still required before calling a variant validated. No filter variant has been run or shown to be profitable yet.

OANDA remains the final connection stage. TradingView and the Netlify generated-price dashboard remain separate.
