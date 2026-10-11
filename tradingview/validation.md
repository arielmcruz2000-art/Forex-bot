# First TradingView baseline check

Observed in the TradingView strategy report on 2026-10-11 UTC. This is historical simulation, not live trading or the separate Paper Trading account.

## Configuration

- Script: `Forex Bot | EURUSD M15 | Research v0.1`, saved privately in TradingView and successfully added to the chart.
- Repository baseline: `309774d36d522e661128d5383a69b9fe1eb19ed5`. The editor used the same strategy with compact formatting and comments omitted.
- Feed: `OANDA:EURUSD`; standard candles, 15 minutes. This is a data feed selection; no OANDA brokerage account was connected.
- Report range shown by TradingView: June 30, 2026 through October 9, 2026. The script's broader 2024-2027 date inputs do not establish access to that entire history.
- Initial simulated capital: USD 1,000. Risk input: 1%. SMA lengths: 5 and 20. Stop: 20 pips. Gross target: 40 pips. One position at a time.
- Script costs: commission proxy USD 0.00005 per unit per side; one tick slippage. Illustrative 2% margin. No dynamic spreads or swap costs.
- Chart and script were saved. No alert, webhook or brokerage execution was activated. The Netlify dashboard remains a separate generated-price simulation.

## Metrics displayed

| TradingView label | Value |
| --- | ---: |
| Total PnL | -84.94 USD (-8.49%) |
| Max drawdown | 189.59 USD (17.69%) |
| Profitable trades | 29.31% (17 of 58) |
| Profit factor | 0.766 |
| Total closed trades | 58 |
| Losing trades | 41 |
| Breakeven trades | 0 |

Values are transcribed from the displayed report, not recomputed from an exported trade ledger. A simulated short remained open on the final available bar, so the headline PnL should not be treated as an all-positions-closed result. Dollar and percentage drawdown values are reported as TradingView displays them; the percentage should not be calculated by dividing the dollar figure by initial capital.

The follow-up [trade audit](audit.md) separately sums all 58 closed rows and records the open position and reconciliation limits.

## Assessment and next validation

The unchanged baseline lost money in this sample and its profit factor was below 1. This does not support an earnings projection or deployment to real money. This first window is now a development sample, not an untouched out-of-sample test.

Before any execution integration: reconcile closed and open PnL against the trade ledger, inspect fill assumptions, stress higher spreads/slippage, compare nearby parameters on development data, and evaluate a separate untouched period with enough trades. The NY daily entry lock blocks new entries after the configured loss threshold; it is not a guaranteed loss cap. OHLC backtesting, missing swap and fixed cost assumptions limit realism.

OANDA practice connection remains the last stage, as requested.
