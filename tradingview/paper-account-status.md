# TradingView Paper Trading account — October 11, 2026

The user selected TradingView Paper Trading as the desired demo account. The built-in simulator was connected successfully through the chart's Trade panel. No OANDA brokerage account was connected. Only fictitious funds are involved.

Visible account baseline: USD100,000 balance and equity, realized P/L0, unrealized P/L0, no open positions, no Orders rows and no Trade history rows. Drawdown and profit factor were not inspected/reported and remain unknown. Existing funds were not reset or changed. This account capital differs from the frozen Pine research capital USD1,000; never combine the ledgers or compare absolute gains without their own capital bases.

## Concrete automation limitation

Pine cannot place orders in TradingView's built-in Paper Trading account. TradingView's official FAQ explicitly documents this: https://www.tradingview.com/pine-script-docs/faq/strategies/#can-i-connect-my-strategies-to-my-paper-trading-account . Connecting the simulator does not route strategy.entry/exit calls into this account. A paid alert allowance would not itself solve that native integration limitation. No automatic Paper Trading execution is enabled and no orders were submitted by the agent.

The existing weekday evening reporting automation was updated successfully to inspect both ledgers separately. paper-account-observations.jsonl records only visible account snapshots; forward-observations.jsonl and forward-trades.jsonl continue to track the frozen Pine emulator study. Any manual account trade must remain unattributed to the bot unless verified. Do not reset the account, change source parameters, route orders, create webhooks, purchase subscriptions or connect OANDA during reporting.

The Pine future window begins October12 UTC, with the first eligible weekday signal closes at07:00 America/New_York. Before then no independent profitability sample exists. Strategy costs are approximations and financing remains unmodeled. Netlify generated prices remain excluded.
