import {createHash} from 'node:crypto';
import {evaluatePracticeIntent} from './practice-intent.mjs';
import {practiceRead,practiceUpdate,event} from './practice-storage.mjs';
const END=Date.parse('2026-12-12T00:00:00Z');
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
const dayAt=now=>formatter.format(now);
const number=value=>{if(value==null||value==='')throw Error('missing-number');const n=Number(value);if(!Number.isFinite(n))throw Error('invalid-number');return n;};
const round=value=>Math.round(value*1e6)/1e6;
const tradeNet=t=>t.realizedPL+t.financing-t.commission-t.guaranteedFee;
const openNet=t=>t.unrealizedPL;
export function practiceReport(s,now=Date.now()) {
  const closed=s.trades.filter(t=>t.state==='CLOSED'),open=s.trades.filter(t=>t.state==='OPEN');
  const closedNet=closed.reduce((v,t)=>v+tradeNet(t),0),openPL=open.reduce((v,t)=>v+openNet(t),0);
  const realized=s.trades.reduce((v,t)=>v+tradeNet(t),0);
  const profits=closed.reduce((v,t)=>v+Math.max(0,tradeNet(t)),0),losses=closed.reduce((v,t)=>v+Math.max(0,-tradeNet(t)),0);
  return {mode:'oanda-practice-engine',environment:'practice',data_source:'market-data/OANDA-practice-execution',real_execution_enabled:false,execution_enabled:s.active&&!s.kill&&!s.fault,order_routing_enabled:s.active&&!s.kill&&!s.fault,active:s.active,kill:s.kill,initialized:s.initialized,fault:s.fault,last_tick_utc:s.lastTick,heartbeat_stale:!s.lastTick||now-Date.parse(s.lastTick)>180000,last_decision:s.lastDecision,research_capital_usd:1000,research_equity_usd:s.initialized?round(1000+realized+openPL):null,closed_pnl_usd:s.initialized?round(closedNet):null,open_pnl_usd:s.initialized?round(openPL):null,open_trade_realized_costs_usd:s.initialized?round(realized-closedNet):null,closed_trades:s.initialized?closed.length:null,open_trades:s.initialized?open.length:null,profit_factor:losses>0?profits/losses:null,drawdown_observed_pct:s.initialized?s.maxDrawdownPct:null,daily_locked:s.dailyLocked,day:s.day,day_start_equity_usd:s.dayStartEquity,pending_status:s.pending?.status??null,account:s.account,trades:s.trades,events:s.events.slice(-30),notes:'Demo solamente. Capital de estudio 1000 USD; no es todo el saldo de la cuenta. P/L incluye financiación y comisiones informadas por OANDA. Spread ya está en los fills y no se resta dos veces. Drawdown observado por consultas, no tick continuo. Muestra insuficiente hasta estudiar suficientes operaciones.'};
}
export async function practiceControl(store,payload,now=Date.now()){
  if(!['start','pause','kill','resume'].includes(payload?.action)||typeof payload.id!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(payload.id))throw Error('invalid-practice-command');
  return practiceUpdate(store,s=>{
    if(s.commands.includes(payload.id))return false;
    if(payload.action==='start'||payload.action==='resume'){
      if(payload.action==='resume'&&!s.pending&&s.trades.every(t=>t.state==='CLOSED')&&s.account?.openTrades===0&&s.account?.pendingOrders===0){
        if(s.fault==='protection-failed-close-requested')s.fault=null;s.kill=false;
      }
      if(s.fault||s.dailyLocked||s.pending||s.kill||!s.initialized||!s.preflight||now>=END)throw Error('practice-not-ready');s.active=true;
    }else {s.active=false;if(payload.action==='kill')s.kill=true;}
    s.commands.push(payload.id);s.commands=s.commands.slice(-200);event(s,'command-'+payload.action,now);
  });
}
export function executableOrder(intent,price,instrument,account,now){
  const bid=number(price.bids?.[0]?.price),ask=number(price.asks?.[0]?.price),age=now-Date.parse(price.time);
  if(price.status!=='tradeable'||!Number.isFinite(age)||age<0||age>15000||bid<=0||ask<bid||ask-bid>0.000200001)throw Error('stale-price-or-wide-spread');
  const margin=Math.max(0.02,number(instrument.marginRate),number(account.marginRate));
  if(instrument.displayPrecision!==5||instrument.tradeUnitsPrecision!==0||instrument.pipLocation!==-4)throw Error('unsupported-instrument');
  if(number(account.openTradeCount)!==0||number(account.openPositionCount)!==0||number(account.pendingOrderCount)!==0)throw Error('existing-account-exposure');
  const available=number(account.marginAvailable),equity=number(account.NAV);
  if(available<=0||equity<=0)throw Error('insufficient-margin');
  const commission=instrument.commission;
  const feeUnit=commission?number(commission.commission)/number(commission.unitsTraded):0;
  const minimumFee=commission?number(commission.minimumCommission):0;
  if(!Number.isFinite(feeUnit)||feeUnit<0||minimumFee<0)throw Error('unsupported-commission');
  const reservePerUnit=0.002+Math.max(0.0002,ask-bid)+0.00004+feeUnit*2;
  const units=Math.floor(Math.min(100000,intent.units,(intent.riskBudgetUsd-minimumFee*2)/reservePerUnit,available*0.95/(ask*margin),number(instrument.maximumOrderUnits)));
  if(units<Math.max(1,number(instrument.minimumTradeSize)))throw Error('insufficient-order-budget');
  const id='fb05-'+createHash('sha256').update(intent.signalKey).digest('hex').slice(0,32);
  return {type:'MARKET',instrument:'EUR_USD',units:String(-units),timeInForce:'FOK',positionFill:'OPEN_ONLY',priceBound:(bid-0.00002).toFixed(5),clientExtensions:{id,tag:'forex-bot-v05'},tradeClientExtensions:{id,tag:'forex-bot-v05'},stopLossOnFill:{distance:'0.00200',timeInForce:'GTC'},takeProfitOnFill:{price:(bid-0.006).toFixed(5),timeInForce:'GTC'}};
}
function ingest(s,transactions){
  for(const tx of transactions){
    if(!/^\d+$/.test(tx.id)||!Number.isFinite(Date.parse(tx.time)))throw Error('invalid-transaction');
    if(s.pending&&tx.type==='MARKET_ORDER'&&tx.clientExtensions?.id===s.pending.clientId)s.pending.orderId=tx.id;
    if(s.pending&&((tx.type==='MARKET_ORDER_REJECT'&&tx.clientExtensions?.id===s.pending.clientId)||(tx.type==='ORDER_CANCEL'&&(tx.clientOrderID===s.pending.clientId||tx.orderID===s.pending.orderId)))){
      s.pending=null;if(s.fault==='entry-response-unknown'||s.fault==='practice-check-failed')s.fault=null;event(s,'entry-not-filled',Date.parse(tx.time));
    }
    if(tx.type==='ORDER_FILL'){
      const owned=Boolean(s.pending&&(tx.clientOrderID===s.pending.clientId||tx.tradeOpened?.clientExtensions?.id===s.pending.clientId));
      if(owned&&tx.tradeOpened){
        const o=tx.tradeOpened;if(tx.instrument!=='EUR_USD'||number(o.units)>=0)throw Error('unexpected-fill');
        if(!s.trades.some(t=>t.id===o.tradeID))s.trades.push({id:o.tradeID,clientId:s.pending?.clientId??o.clientExtensions?.id,signalClose:s.pending?.signalClose??null,state:'OPEN',entryTime:tx.time,entry:number(o.price??tx.price),units:-number(o.units),realizedPL:0,unrealizedPL:0,financing:0,commission:number(tx.commission),guaranteedFee:0,exitTime:null,exit:null,stop:null,target:null});
        if(s.pending){s.pending.status='filled';s.pending.tradeId=o.tradeID;if(s.fault==='entry-response-unknown'||s.fault==='practice-check-failed')s.fault=null;}
      }
      const reductions=[...(tx.tradesClosed??[]),...(tx.tradeReduced?[tx.tradeReduced]:[])];
      const bot=reductions.filter(r=>s.trades.some(t=>t.id===r.tradeID));
      if(bot.length){
        if(bot.length!==reductions.length||tx.tradeOpened)throw Error('mixed-fill-attribution');
        const commission=number(tx.commission),total=bot.reduce((v,r)=>v+Math.abs(number(r.units)),0);
        for(const r of bot){const t=s.trades.find(t=>t.id===r.tradeID);t.commission+=commission*Math.abs(number(r.units))/total;t.guaranteedFee+=number(r.guaranteedExecutionFee??0);t.exit=number(r.price??tx.price);}
      }
    }
  }
}
function updateTrade(t,remote){
  if(!['OPEN','CLOSED'].includes(remote.state)||number(remote.initialUnits)!==-t.units)throw Error('unexpected-trade-state');
  t.state=remote.state;t.realizedPL=number(remote.realizedPL);t.unrealizedPL=remote.state==='OPEN'?number(remote.unrealizedPL):0;t.financing=number(remote.financing);
  if(remote.state==='CLOSED'){if(!Number.isFinite(Date.parse(remote.closeTime)))throw Error('missing-close-time');t.exitTime=remote.closeTime;}
  if(remote.state==='OPEN'){t.stop=remote.stopLossOrder?.state==='PENDING'?number(remote.stopLossOrder.price):null;t.target=remote.takeProfitOrder?.state==='PENDING'?number(remote.takeProfitOrder.price):null;}
}
export async function practiceTick(store,broker,now=Date.now()){
  const started=performance.now(),clock=()=>now+Math.floor(performance.now()-started);
  const owner=crypto.randomUUID();
  const claimed=await practiceUpdate(store,s=>{if(s.lease&&s.lease.expires>now)return false;s.lease={owner,expires:now+120000};});
  if(claimed.lease?.owner!==owner)return practiceReport(claimed,now);
  const save=fn=>practiceUpdate(store,s=>{if(s.lease?.owner!==owner)throw Error('lost-engine-lease');fn(s);});
  const canWrite=async()=>{const s=await practiceRead(store);if(s.lease?.owner!==owner||s.lease.expires<=clock()||s.kill||!s.active||s.fault||performance.now()-started>18000)throw Error('entry-disabled');return s;};
  try{
    const account=await broker.account();
    let s=await save(s=>{
      const binding=createHash('sha256').update(String(account.id)).digest('hex');
      if(s.accountBinding&&s.accountBinding!==binding)throw Error('account-binding-changed');
      if(!s.accountBinding&&(s.trades.length||s.pending))throw Error('account-binding-changed');
      s.accountBinding=binding;
      s.lastTick=new Date(now).toISOString();s.account={balance:number(account.balance),equity:number(account.NAV),realizedPL:number(account.pl),unrealizedPL:number(account.unrealizedPL),openTrades:number(account.openTradeCount),pendingOrders:number(account.pendingOrderCount)};
      if(!s.initialized){
        if(number(account.openTradeCount)||number(account.openPositionCount)||number(account.pendingOrderCount))throw Error('account-must-start-flat');
        if(!/^\d+$/.test(account.lastTransactionID)||number(account.NAV)<1000)throw Error('invalid-account-baseline');
        s.initialized=true;s.cursor=account.lastTransactionID;s.baselineTransaction=account.lastTransactionID;event(s,'practice-baseline-ready',now);
      }
    });
    if(!s.preflight){
      const i=await broker.instrument();
      if(i.displayPrecision!==5||i.tradeUnitsPrecision!==0||i.pipLocation!==-4||number(i.marginRate)<=0||number(i.minimumTradeSize)>4464||number(i.maximumOrderUnits)<1||account.guaranteedStopLossOrderMode==='REQUIRED')throw Error('unsupported-instrument');
      s=await save(s=>{s.preflight=true;event(s,'instrument-preflight-ready',now);});
    }
    const delta=await broker.transactions(s.cursor);
    if(!/^\d+$/.test(delta.lastTransactionID)||BigInt(delta.lastTransactionID)<BigInt(s.cursor)||delta.transactions.some((t,i)=>!/^\d+$/.test(t.id)||BigInt(t.id)<=BigInt(i?delta.transactions[i-1].id:s.cursor)||BigInt(t.id)>BigInt(delta.lastTransactionID)))throw Error('invalid-transaction-range');
    s=await save(s=>{ingest(s,delta.transactions);s.cursor=delta.lastTransactionID;});
    if(s.pending&&s.pending.status==='submitting'){
      try{const order=await broker.order(s.pending.clientId);
        if(order.state==='FILLED'&&order.tradeOpenedID){
          // Transaction polling should normally provide the fill before this lookup.
          const remote=await broker.trade(order.tradeOpenedID);
          s=await save(s=>{if(!s.trades.some(t=>t.id===remote.id))throw Error('missing-fill-cost-evidence');s.pending.status='filled';s.pending.tradeId=remote.id;});
        }else if(['CANCELLED','REJECTED'].includes(order.state))s=await save(s=>{event(s,'entry-not-filled',now);s.pending=null;if(s.fault==='entry-response-unknown')s.fault=null;});
        else throw Error('entry-response-unknown');
      }catch{throw Error('entry-response-unknown');}
    }
    // Read closed and open owned trades. Cumulative financing replaces old values;
    // transaction commissions are processed once by the persisted cursor.
    for(const owned of s.trades.filter(t=>t.state==='OPEN')){
      const remote=await broker.trade(owned.id);s=await save(s=>updateTrade(s.trades.find(t=>t.id===owned.id),remote));
    }
    // Repair brackets from actual fill, never cancel them when entries are paused.
    for(const t of s.trades.filter(t=>t.state==='OPEN')){
      if(s.kill||now>=END){await broker.close(t.id);s=await save(s=>event(s,'owned-trade-close-requested',now));continue;}
      if(t.stop===null||Math.abs(t.stop-(t.entry+0.002))>0.0000051||t.target===null||Math.abs(t.target-(t.entry-0.006))>0.0000051){
        try{await broker.protect(t.id,t.entry);const remote=await broker.trade(t.id);s=await save(s=>updateTrade(s.trades.find(v=>v.id===t.id),remote));
          const repaired=s.trades.find(v=>v.id===t.id);if(repaired.state==='OPEN'&&(repaired.stop===null||repaired.target===null||Math.abs(repaired.stop-repaired.entry-0.002)>0.0000051||Math.abs(repaired.entry-repaired.target-0.006)>0.0000051))throw Error('protection-unconfirmed');
        }catch{await broker.close(t.id);throw Error('protection-failed-close-requested');}
      }
    }
    s=await save(s=>{
      if(s.pending?.status==='filled'){s.pending=null;if(s.fault==='practice-check-failed')s.fault=null;}
      const report=practiceReport(s,now),equity=report.research_equity_usd,day=dayAt(now);
      if(s.day!==day){s.day=day;s.dayStartEquity=s.lastEquity;s.dailyLocked=false;}
      if(equity<=s.dayStartEquity*0.96)s.dailyLocked=true;
      s.lastEquity=equity;s.peakEquity=Math.max(s.peakEquity,equity);s.maxDrawdownPct=Math.max(s.maxDrawdownPct,(s.peakEquity-equity)/s.peakEquity*100);
      if(now>=END)s.active=false;
    });
    if(!s.active||s.kill||s.fault||s.pending)return practiceReport(s,now);
    const candles=await broker.candles();
    const snapshot={environment:'practice',read_connected:true,execution_enabled:false,order_routing_enabled:false,instrument:'EUR_USD',granularity:'M15',currency:'USD',equity:number(account.NAV),open_trade_count:number(account.openTradeCount),open_position_count:number(account.openPositionCount),pending_order_count:number(account.pendingOrderCount),candles};
    const intent=evaluatePracticeIntent(snapshot,{day:s.day,researchEquity:s.lastEquity,dayStartEquity:s.dayStartEquity,dailyLocked:s.dailyLocked,openPositions:s.trades.filter(t=>t.state==='OPEN').length,lastSignalKey:s.lastSignalKey},now);
    s=await save(s=>{s.lastDecision={status:intent.status,reason:intent.reason??null,time:new Date(now).toISOString()};});
    if(intent.status!=='candidate')return practiceReport(s,now);
    const price=await broker.price(),instrument=await broker.instrument(),freshAccount=await broker.account();
    const order=executableOrder(intent,price,instrument,freshAccount,clock());
    await canWrite();
    s=await save(s=>{if(!s.active||s.kill||s.fault||s.pending||s.dailyLocked||s.lastSignalKey===intent.signalKey)throw Error('entry-disabled');s.lastSignalKey=intent.signalKey;s.pending={status:'submitting',clientId:order.clientExtensions.id,signalClose:intent.signalCloseUtc,submittedAt:new Date(now).toISOString()};event(s,'entry-claim-persisted',now);});
    await canWrite(); // no retry of POST if response or storage result is unknown
    const response=await broker.submit(order);
    const txs=[response.orderFillTransaction,response.orderCancelTransaction,response.orderRejectTransaction].filter(Boolean);
    // Polling the transaction cursor on next invocation records all fills once.
    if(!response.orderFillTransaction&&!response.orderCancelTransaction&&!response.orderRejectTransaction)throw Error('entry-response-unknown');
    if(response.orderFillTransaction){
      const opened=response.orderFillTransaction.tradeOpened;if(!opened?.tradeID)throw Error('entry-response-unknown');
      // Stop is already on-fill; now anchor the target to the actual fill.
      try{await broker.protect(opened.tradeID,number(opened.price??response.orderFillTransaction.price));}
      catch{await broker.close(opened.tradeID);throw Error('protection-failed-close-requested');}
    }
    s=await save(s=>{event(s,txs.some(t=>t.type==='ORDER_FILL')?'entry-fill-awaiting-reconciliation':'entry-not-filled-awaiting-reconciliation',now);});
    return practiceReport(s,now);
  }catch(e){
    const codes=['account-binding-changed','entry-response-unknown','protection-failed-close-requested','existing-account-exposure','stale-price-or-wide-spread','insufficient-order-budget','unsupported-instrument','unsupported-commission','insufficient-margin','entry-disabled'];
    const code=codes.includes(e.message)?e.message:'practice-check-failed';
    const s=await save(s=>{s.lastDecision={status:'blocked',reason:code,time:new Date(now).toISOString()};event(s,code,now);if(s.pending||code==='protection-failed-close-requested'||code==='account-binding-changed'){s.active=false;s.fault=code;}});
    return practiceReport(s,now);
  }finally{await save(s=>{s.lease=null;});}
}
