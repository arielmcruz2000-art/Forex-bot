# OANDA Practice read integration: technical verification

On October11,2026 the user authorized read access to OANDA Practice. The private Netlify panel's Configuración > Comprobar cuenta demo OANDA successfully verified the fixed practice API endpoint, USD demo response and EUR_USD M15 complete midpoint candles. The adapter and verification panel are published. All18 Node tests and frontend syntax checks passed. This supersedes earlier disconnected status for practice reading only.

No orders were submitted. execution_enabled=false and order_routing_enabled=false. Real-money access is disabled. This endpoint performs on-demand reads and does not start an automated demo-order engine. The generated-price simulation remains separate and unchanged; Pine study parameters remain frozen.

The existing reporting task now includes independent OANDA Practice and TradingView Paper Trading sections delivered privately in the conversation. Account balances, equity, P/L, identifiers and credentials must not be written to GitHub without explicit user authorization for that disclosure. An attempted account-data evidence commit was rejected by automatic approval review; no OANDA account-data evidence file was published. Only these technical integration facts are recorded here.

Further work requires consistent real-candle strategy rules, durable risk/execution reconciliation and practice-only controls before any demo orders are enabled. Report methodology and financing assumptions separately from synthetic and Pine-emulator results.

## October 11 implementation update

The user subsequently requested completing and starting the demo bot. A separate Practice-only order engine is now implemented with durable claims, reconciliation, on-fill protective stop, actual-fill bracket verification and private reports. The earlier read-only statement describes that earlier verification and the read endpoint, not the new engine. The new engine starts paused; published activation and scheduler evidence must be checked separately. Live endpoints remain unavailable. No account financial evidence is committed here. See practice-engine-readiness.md.

## Practice activation verified

The private production panel confirmed the user-requested demo start. A native scheduled cycle advanced independently at 2026-10-11T15:51:04Z after correcting the scheduler metadata guard. Netlify showed practice-tick scheduled every minute in production; its invocation log and the private panel agreed. At that observation the engine was waiting for the frozen future test window. No strategy fill can be validated before the first eligible market session. These are technical activation facts only, without account balances, P/L or identifiers.

The reporting automation now reads the separate OANDA Demo report without executing a cycle or changing controls. It preserves private broker evidence in the conversation, keeps Pine emulator evidence in its authorized GitHub records, and never attributes artificial returns to market execution. Live execution remains blocked.
