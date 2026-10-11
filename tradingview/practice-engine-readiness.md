# OANDA Practice engine: implementation and activation checklist

Updated October 11, 2026. The user now requests completing and starting the demo bot. This supersedes the earlier read-only restriction for the new Practice engine only. Live execution remains impossible through the fixed-host adapter. Frozen TradingView source and emulator reporting remain unchanged and independent.

## Implemented

- Private production API controls and a separate OANDA Demo panel. Default state is paused until verified initialization and an explicit start command.
- Scheduled `practice-tick` every minute on published production, independent of the browser. Private strong-consistency `forex-oanda-practice-v1` state is separate from artificial simulation storage.
- Complete midpoint M15 SMA5/20 crossunder signals, short only, weekday signal closes 07:00 inclusive–12:00 exclusive America/New_York; October 12–December 12 UTC entry window. Stale signals beyond 90 seconds are rejected. No optimization of frozen Pine parameters.
- A 1000 USD research ledger inside the larger demo account, 1% planned risk, 20-pip stop, 60-pip target, one position, daily 4% persistent entry latch based on bot equity. New NY days use the previous observed bot equity as baseline. Foreign/manual account exposure blocks entries.
- Conservative sizing retains Pine cost reserves and caps units using actual broker margin/commission metadata. Bid/ask spread must be at most 2 pips, quotes at most 15 seconds old. Market orders use FOK, OPEN_ONLY and a two-tick adverse price bound.
- Stop loss is attached on-fill by distance. The initial take-profit uses the current bid; immediately after fill it is replaced with an actual-fill-based target. The next cycle verifies both bracket prices; failed protection requests an owned-trade close and stops entries. A normal pause preserves broker-hosted exits. Emergency mode requests closes only for identified bot trades.
- Atomic lease and persisted signal claim before submission. Unknown POST responses are never retried; transactions and client order lookup reconcile them. Unresolved claims remain paused. A rejected/cancelled entry consumes its signal. Each transaction is processed once by cursor.
- The ledger is bound privately to its Practice account. Changed credentials cannot reuse a different account’s ledger. Instrument precision and trade-size metadata are checked before activation.
- Account-wide P/L remains separate from trade-attributed bot P/L. Broker trade financing is cumulative, commissions come from attributed fills, spread is already in execution prices. Profit factor is null without a losing closed trade. Drawdown is observed by polling, not a tick-level maximum. Reports and JSON exports are private, never committed to GitHub.

## Runtime safeguards and limits

Production inspection showed that native scheduled invocations carry `deploy.context=production` and `deploy.published=false`. The scheduler guard therefore checks the trusted production context; Netlify itself runs scheduled jobs only on the current published deploy and does not expose a URL invocation. Preview/branch contexts are rejected. Private HTTP API controls retain both the production and published checks and verified user login. This runtime distinction is tested explicitly.

Netlify scheduled functions have a 30-second limit. Broker calls time out after 3 seconds; a new entry cannot begin after 18 seconds of work. A crashed process leaves a 120-second lease and its durable claim for reconciliation. Delays can skip signals; no claim of continuous real-time execution or exact TradingView fills is made. Protective orders remain at the broker after process failure. Non-guaranteed stops can exceed planned risk through gaps or slippage. The 4% rule blocks new entries rather than guaranteeing a maximum daily realized loss.

The storage SDK's conditional-write error behavior is guarded by a strict fetch transport, mandatory ETags and strong revision read-back. Missing market, financial or state evidence blocks entries. No credentials or account identifier are returned by the engine or stored in this document.

## Remaining verification

Activation must be verified on the published private panel: initialized baseline, recent scheduled heartbeat, active demo state, real execution disabled. Engineering tests use synthetic broker fixtures and prove controls, not profitability. A first genuine strategy signal and its demo fill cannot be demonstrated before an eligible market session occurs. Preserve the independent TradingView forward observation and its history completeness gate; the demo is an additional execution experiment, not prior strategy validation.

At test end the engine pauses entries and requests owned-trade closure. On a kill or resolved protection incident, an operator may rearm only after account and owned-trade exposure is reconciled flat. Unresolved submission uncertainty cannot be forcibly cleared by the public controls.

Primary API references: https://developer.oanda.com/rest-live-v20/order-ep/ , https://developer.oanda.com/rest-live-v20/transaction-df/ , https://developer.oanda.com/rest-live-v20/trade-ep/ , https://docs.netlify.com/build/functions/scheduled-functions/ , https://docs.netlify.com/build/data-and-storage/netlify-blobs/ .
