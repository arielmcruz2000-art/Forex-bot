# Session-only trade audit — 2026-10-11 UTC

All 47 closed trades of the predeclared weekday 07:00–12:00 New York entry-window experiment were read from TradingView's visible table. IDs 1–47 were present exactly once after deduplication. Source transcription: `session-audit-observed-rows.json`. This is rounded UI text, not a full-precision CSV export. No broker, alert or Netlify engine change was made.

## Reconciliation and entry check

The rounded closed rows sum to -48.52 USD versus -48.53 USD displayed by the report, a one-cent rounding difference. There was no additional open trade in this experiment. All displayed entry timestamps, interpreted in the chart's UTC timezone and converted to America/New_York, fell on weekdays between 07:00 inclusive and 12:00 exclusive. This checks the session gate for the captured sample; it does not validate profitability.

| Side | Closed trades | Winners | Losers | Net PnL, rounded rows | Profit factor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Long | 30 | 7 | 23 | -100.70 USD | 0.555 |
| Short | 17 | 8 | 9 | +52.18 USD | 1.594 |
| Total | 47 | 15 | 32 | -48.52 USD | 0.846 |

Average closed winner: 17.72 USD; average loser: 9.82 USD. The original baseline had an 18-trade losing streak; this session experiment's longest was seven losses, trades #28–34, totaling -68.24 USD. Six were long and one was short. This is an observed sample improvement, not an established future bound.

## Holding duration and gap

Median holding time was 14.5 hours. Seventeen trades lasted longer than 24 hours; the maximum was 141.25 hours. Restricting entry hours did not restrict holding duration or force positions flat at the session end. Swap remains absent from the cost model.

Thirty-one losses moved -20.1 pips between displayed fills; the fifteen winners moved +40 pips. Trade #7, a long entered July 9 at 12:45 UTC and exited July 12 at 21:00 UTC, moved -26.6 pips and lost 12.61 USD after 80.25 hours. Its exit timestamp coincides with the Sunday reopening and is consistent with a weekend gap through the stop. The UI fill record alone does not independently reconstruct the quote path. A configured 20-pip stop is not a guaranteed 20-pip maximum loss.

## Descriptive breakdowns

| Exit month, UTC | Closed trades | Rounded PnL |
| --- | ---: | ---: |
| July | 16 | +35.10 USD |
| August | 9 | -34.17 USD |
| September | 16 | -72.64 USD |
| October through October 9 | 6 | +23.19 USD |

These assign each whole trade to its exit month and are not mark-to-market monthly equity returns.

| Entry hour, New York | Trades | Rounded PnL |
| --- | ---: | ---: |
| 07:00–07:59 | 10 | -40.74 USD |
| 08:00–08:59 | 15 | -39.48 USD |
| 09:00–09:59 | 6 | -4.08 USD |
| 10:00–10:59 | 9 | +48.28 USD |
| 11:00–11:59 | 7 | -12.50 USD |

These hour groups are small and identified after inspecting results. Selecting only the positive hour now would introduce additional selection bias. They do not support deployment or a claim that 10:00 is a reliably profitable hour.

## Next research hypothesis

The short side was positive in these 17 closed trades, while longs outweighed its gains. This motivates one diagnostic experiment: rerun the unchanged session strategy with short entries only, preserving capital, 1% risk, costs, stops, targets and session window. Simply deleting long PnL from this ledger is not that backtest: removing longs changes equity, sizing and which short signals are eligible under the one-position rule.

If that independent diagnostic shows a positive development result, evaluate a separate untouched interval and higher costs before calling it a candidate. Do not simultaneously tune the hour window, ATR thresholds and direction. A separate holding-time/weekend-exposure experiment may be warranted by the gap, but has not been implemented or tested. No short-only variant was run during this audit.

The baseline and all experiments remain research. OANDA stays disconnected and the Netlify panel continues its separate generated-price simulation.
