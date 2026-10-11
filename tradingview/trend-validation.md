# Trend-filter experiment — 2026-10-11 UTC

The predeclared trend filter compiled and ran in TradingView. It did not improve profitability on the baseline development sample. It remains research only; no Netlify strategy or broker execution was changed.

## Change and controlled conditions

Source: `forex-sma-trend-m15.pine`. Saved as a separate private TradingView script, preserving the baseline. Longs require close above the trend SMA and trend SMA greater than its value five confirmed bars earlier. Shorts require the opposite. All calculations use the chart's standard EUR/USD M15 candles; no higher-timeframe or future data was added.

Feed: OANDA:EURUSD. Report window: June 30–October 9, 2026. USD 1,000 initial capital, 1% risk input, SMA 5/20 entry, 20-pip stop, 40-pip gross target, one position, no pyramiding. Commission 0.00005 USD/unit per side, one tick slippage, 50x illustrative leverage, on-bar-close script execution and next-tick order delay were verified in the strategy properties. The original script and filtered script are independent backtests, not a combined portfolio.

Trend lengths 100, 80 and 120 were tested as specified before inspecting results. No best length was selected for deployment.

## Observed strategy report

| Variant | Headline Total PnL | Max drawdown | Winners / closed trades | Profit factor |
| --- | ---: | ---: | ---: | ---: |
| Baseline, no trend filter | -84.94 USD (-8.49%) | 189.59 USD (17.69%) | 17/58 (29.31%) | 0.766 |
| Trend SMA 100, slope 5 | -116.18 USD (-11.62%) | 145.90 USD (14.59%) | 17/60 (28.33%) | 0.706 |
| Trend SMA 80, slope 5 | -142.30 USD (-14.23%) | 142.30 USD (14.23%) | 17/63 (26.98%) | 0.662 |
| Trend SMA 120, slope 5 | -189.39 USD (-18.94%) | 216.65 USD (21.67%) | 15/63 (23.81%) | 0.550 |

These are displayed headline metrics, not a full-precision ledger reconciliation. The baseline still had an open short, and its rounded closed-trade sum was -94.94 USD (see `audit.md`). The filtered strategies displayed no active stop/target plot on the final bar. Do not compare the baseline headline to the filtered numbers as if every variant necessarily closed all positions at the same cutoff.

At length 100, the report showed long contribution -52.07 USD and short contribution -64.11 USD. Long losses decreased compared with the baseline, but short losses increased enough to worsen the total. This does not isolate causality: the one-position rule changes which later signals are eligible after a trade is filtered.

## Assessment

All three filtered runs had lower profit factor and more negative headline PnL than the baseline. Lengths 80 and 100 reduced displayed drawdown, but none established a positive expectancy. Nearby parameter results varied substantially. A trend-only filter is insufficient on this development sample.

No high-cost stress test or untouched-period validation was completed in this experiment. There is no positive candidate to promote. Next research should examine signal timing, volatility and holding duration using a small predeclared comparison; avoid combining many tuned filters until the sample happens to show a profit. Any candidate must later face higher costs and an untouched period.

The TradingView chart was saved with the experiment restored to its predeclared SMA 100 / slope 5 settings. The Netlify generated-price engine and its risk settings were not changed. No webhook, alert, OANDA practice account or live trading was activated.
