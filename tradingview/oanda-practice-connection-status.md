# OANDA Practice read integration: technical verification

On October11,2026 the user authorized read access to OANDA Practice. The private Netlify panel's Configuración > Comprobar cuenta demo OANDA successfully verified the fixed practice API endpoint, USD demo response and EUR_USD M15 complete midpoint candles. The adapter and verification panel are published. All18 Node tests and frontend syntax checks passed. This supersedes earlier disconnected status for practice reading only.

No orders were submitted. execution_enabled=false and order_routing_enabled=false. Real-money access is disabled. This endpoint performs on-demand reads and does not start an automated demo-order engine. The generated-price simulation remains separate and unchanged; Pine study parameters remain frozen.

The existing reporting task now includes independent OANDA Practice and TradingView Paper Trading sections delivered privately in the conversation. Account balances, equity, P/L, identifiers and credentials must not be written to GitHub without explicit user authorization for that disclosure. An attempted account-data evidence commit was rejected by automatic approval review; no OANDA account-data evidence file was published. Only these technical integration facts are recorded here.

Further work requires consistent real-candle strategy rules, durable risk/execution reconciliation and practice-only controls before any demo orders are enabled. Report methodology and financing assumptions separately from synthetic and Pine-emulator results.
