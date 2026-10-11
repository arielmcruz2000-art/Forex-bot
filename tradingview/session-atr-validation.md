# Independent session and ATR experiments — 2026-10-11 UTC

Both filters compiled and were tested separately, not combined. Neither produced a profitable development result. No Netlify engine or broker connection was changed.

## Predeclared conditions

The original baseline is reused without its unsuccessful SMA trend filter. New file: `forex-sma-session-atr-m15.pine`. Its `Research filter` input selects None, Session or ATR. Risk stays at 1%, entry SMA 5/20, stop 20 pips, gross target 40 pips, one position, initial capital USD 1,000. Feed OANDA:EURUSD; standard 15-minute candles. Fixed commission proxy, one-tick slippage and fill timing are unchanged.

- Session: confirmed signal close on Monday–Friday, from 07:00 inclusive until 12:00 exclusive in America/New_York. `hour(time_close, ny)` and `dayofweek(time_close, ny)` handle timezone and daylight saving. This filters new entries only; existing protective exits remain active outside that window. It does not force positions flat overnight.
- ATR: Wilder ATR over 14 chart bars, converted to EUR/USD pips, between 3 and 15 pips inclusive at confirmed close. No session condition in this mode. Bounds were chosen before inspecting this test, not optimized afterward.
- None: control to ensure the new script reproduces the original result before interpreting filters.

## Results observed in TradingView

Report range for each run: June 30–October 9, 2026, the same development window already inspected. None exactly reproduced the baseline headline PnL, drawdown, winner count and profit factor.

| Mode | Headline Total PnL | Max drawdown | Winners / closed trades | Profit factor |
| --- | ---: | ---: | ---: | ---: |
| None / original control | -84.94 USD (-8.49%) | 189.59 USD (17.69%) | 17/58 (29.31%) | 0.766 |
| Session only | -48.53 USD (-4.85%) | 126.10 USD (12.18%) | 15/47 (31.91%) | 0.846 |
| ATR only | -57.06 USD (-5.71%) | 195.37 USD (17.69%) | 17/55 (30.91%) | 0.826 |

These are displayed report values, not a full-precision trade-ledger reconciliation. The baseline and ATR runs plotted a protective stop and target at the final bar, indicating a remaining simulated position; Session displayed no active protective plots. Headline PnL comparisons therefore differ from an all-positions-closed comparison. Closed-trade profit factors were also below 1 in every run. The complete 58-row baseline audit remains in `audit.md`; filtered ledgers have not been fully audited.

## Interpretation and remaining work

Session was the stronger descriptive improvement: smaller loss, smaller drawdown and higher profit factor, with fewer closed trades. It still lost money, and the win rate remained too low for this observed payoff structure. ATR improved the headline loss and profit factor but did not improve percentage drawdown; dollar drawdown increased.

None of these results validates positive expectancy or an income projection. No combined Session+ATR rule, nearby hours or ATR bounds, high-cost stress test, or untouched-period test was run. Repeatedly inspecting this window makes it development data. Do not select many additional thresholds merely to make it profitable.

The next useful review is the Session trade ledger: reconcile closed PnL, identify loss streaks and holding durations, and determine whether a distinct signal rule is justified. Keep the baseline as a control. Any positive candidate later requires higher costs, more history and an untouched period before execution integration.

The chart was saved with Session selected for review. The code's default remains None. The trend test's chart instance was removed to respect the Basic plan's two-strategy limit; its saved script, repository source and prior results were preserved. No plan upgrade, alert, webhook or OANDA account connection was activated.

The repository source was checked against the actual editor source and matched after excluding whitespace and comment lines. Compilation and historical report checks were performed in TradingView, not a local Pine compiler.
