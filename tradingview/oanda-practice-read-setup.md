# OANDA Practice: server-side read setup

Status: implemented and tested with mocked responses; no actual OANDA account connection verified. User confirmed a USD100,000 demo v20 account and generated a token. No token or account identifier is recorded here.

In the Forex-bot Netlify project's Environment variables, set production values:

| Name | Value |
| --- | --- |
| OANDA_PRACTICE_TOKEN | Personal token entered privately in Netlify; mark Contains secret values when available |
| OANDA_PRACTICE_ACCOUNT_ID | Identifier of the confirmed DEMO account, beginning 101- |
| OANDA_PRACTICE_READ_ENABLED | true |

Use the Functions scope where available. Never place the token in GitHub, netlify.toml, public frontend code, chat, screenshots or logs. Deploy again after changing the variables: runtime function variables are fixed per deploy. Production here means the published Netlify website, not OANDA live trading.

The authenticated private published site exposes GET /api/oanda-practice. It reads the practice account summary and 100 EUR_USD M15 midpoint candles from the fixed api-fxpractice.oanda.com origin. It returns only complete candles, verifies account identity and USD currency internally, and excludes the account ID and token from the response. Redirects, malformed values and upstream errors fail closed. The response reports execution_enabled=false and order_routing_enabled=false. The route inherits the existing verified Netlify user and published-production checks; POST is rejected.

This route does not advance the artificial Netlify engine, process strategy signals, calculate bot profitability, or place trades. Account cumulative realized P/L is not automatically attributable to this bot. Mid candles do not include executable bid/ask spread or financing. Closed-market candles can be old; inspect their timestamps. Before demo execution, a separate market-data engine, consistent strategy/risk rules, durable signal/fill reconciliation and explicit practice-only order controls are still required.

The existing Python PracticeClient uses the same token and account variable names, but is not deployed as a Netlify function. This Node read adapter is the deployed path. No scheduled OANDA polling or demo order task was enabled. Existing TradingView and generated-price ledgers remain unchanged and separate.

References:
- https://developer.oanda.com/rest-live-v20/development-guide/
- https://docs.netlify.com/build/functions/environment-variables/

Validation: npm run check and npm test passed (18 tests). New checks cover disabled/missing configuration, live account rejection, fixed practice host and GET-only requests, redacted error/output, invalid candles/account responses, and private deployment access.
