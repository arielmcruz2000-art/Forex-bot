import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceBroker,BrokerError} from '../server/practice-broker.mjs';
import {initialPractice,practiceRead,practiceUpdate} from '../server/practice-storage.mjs';
import {practiceControl,practiceTick,practiceReport,executableOrder} from '../server/practice-engine.mjs';
import {handler} from '../server/api.mjs';
import scheduled from '../netlify/functions/practice-tick.mjs';
const NOW=Date.parse('2026-10-12T11:15:00Z');
class Store {
 data=null;rev=0;
 async getWithMetadata(){return this.data?{data:structuredClone(this.data),etag:String(this.rev)}:null;}
 async setJSON(_key,data,opts){if(opts.onlyIfNew&&this.data||opts.onlyIfMatch&&opts.onlyIfMatch!==String(this.rev))return {modified:false};this.data=structuredClone(data);this.rev++;return {modified:true,etag:String(this.rev)};}
}
const account=()=>({id:'101-001-11111111-001',currency:'USD',balance:'100000',NAV:'100000',pl:'0',unrealizedPL:'0',openTradeCount:0,openPositionCount:0,pendingOrderCount:0,lastTransactionID:'1',marginRate:'0.02',marginAvailable:'100000'});
const instrument=()=>({displayPrecision:5,tradeUnitsPrecision:0,pipLocation:-4,marginRate:'0.02',maximumOrderUnits:'1000000',minimumTradeSize:'1'});
const price=()=>({status:'tradeable',time:new Date(NOW).toISOString(),bids:[{price:'1.09900'}],asks:[{price:'1.09910'}]});
const candles=()=>Array.from({length:21},(_,i)=>({time:new Date(NOW-(21-i)*900000).toISOString(),close:i===20?1.099:1.1,complete:true}));
class Broker {
 calls=[];a=account();tx=[];remote=null;lost=false;failProtection=false;
 async account(){this.calls.push('account');return structuredClone(this.a);}
 async transactions(id){this.calls.push('transactions');return {transactions:this.tx.filter(t=>BigInt(t.id)>BigInt(id)),lastTransactionID:this.tx.at(-1)?.id??'1'};}
 async candles(){return candles();}
 async price(){return price();}
 async instrument(){return instrument();}
 async submit(order){
  this.calls.push('submit');this.remote={id:'3',instrument:'EUR_USD',state:'OPEN',initialUnits:order.units,currentUnits:order.units,price:'1.09899',openTime:new Date(NOW).toISOString(),realizedPL:'0',unrealizedPL:'-0.5',financing:'0',stopLossOrder:{state:'PENDING',price:'1.10099'},takeProfitOrder:{state:'PENDING',price:order.takeProfitOnFill.price}};
  const tx={id:'3',time:new Date(NOW).toISOString(),type:'ORDER_FILL',instrument:'EUR_USD',clientOrderID:order.clientExtensions.id,price:'1.09899',commission:'0.05',tradeOpened:{tradeID:'3',units:order.units,price:'1.09899'}};this.tx.push(tx);this.a.openTradeCount=1;this.a.openPositionCount=1;this.a.pendingOrderCount=2;
  if(this.lost)throw new BrokerError('broker-response-unknown',true);return {orderFillTransaction:tx};
 }
 async trade(){this.calls.push('trade');return structuredClone(this.remote);}
 async order(){return {state:'FILLED',tradeOpenedID:'3'};}
 async protect(id,fill){this.calls.push('protect');if(this.failProtection)throw Error('failed');this.remote.stopLossOrder={state:'PENDING',price:(fill+0.002).toFixed(5)};this.remote.takeProfitOrder={state:'PENDING',price:(fill-0.006).toFixed(5)};}
 async close(){this.calls.push('close');this.remote.state='CLOSED';this.remote.closeTime=new Date(NOW+60000).toISOString();this.remote.realizedPL='-1';this.remote.unrealizedPL='0';this.a.openTradeCount=0;this.a.openPositionCount=0;this.a.pendingOrderCount=0;}
}
const cmd=action=>({action,id:crypto.randomUUID()});
async function active(){const store=new Store(),broker=new Broker();await practiceTick(store,broker,NOW);await practiceControl(store,cmd('start'),NOW);return {store,broker};}
test('initialization remains paused and metrics absent before verified baseline',async()=>{
 const store=new Store(),broker=new Broker();assert.equal(practiceReport(initialPractice(),NOW).closed_pnl_usd,null);
 await assert.rejects(practiceControl(store,cmd('start'),NOW));const r=await practiceTick(store,broker,NOW);assert.equal(r.initialized,true);assert.equal(r.execution_enabled,false);assert.equal(r.research_capital_usd,1000);assert.equal(r.research_equity_usd,1000);assert.equal(broker.calls.includes('submit'),false);
});
test('persisted claim precedes single short entry; restart reconciles and anchors brackets to fill',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);let s=await practiceRead(store);assert.equal(s.pending.status,'submitting');assert.ok(s.lastSignalKey);assert.equal(broker.calls.filter(c=>c==='submit').length,1);
 const r=await practiceTick(store,broker,NOW+60000);s=await practiceRead(store);assert.equal(s.pending,null);assert.equal(r.open_trades,1);assert.equal(r.trades[0].stop,1.10099);assert.equal(r.trades[0].target,1.09299);assert.equal(r.open_trade_realized_costs_usd,-0.05);
 await practiceTick(store,broker,NOW+61000);assert.equal(broker.calls.filter(c=>c==='submit').length,1);assert.equal((await practiceRead(store)).trades[0].commission,0.05);
});
test('parallel ticks cannot issue two entries',async()=>{
 const {store,broker}=await active();await Promise.all([practiceTick(store,broker,NOW),practiceTick(store,broker,NOW)]);assert.equal(broker.calls.filter(c=>c==='submit').length,1);
});
test('lost POST response pauses; reconciliation records actual fill without resubmission',async()=>{
 const {store,broker}=await active();broker.lost=true;let r=await practiceTick(store,broker,NOW);assert.equal(r.active,false);assert.ok(r.fault);assert.equal(r.pending_status,'submitting');
 r=await practiceTick(store,broker,NOW+60000);assert.equal(r.fault,null);assert.equal(r.open_trades,1);assert.equal(r.active,false);assert.equal(broker.calls.filter(c=>c==='submit').length,1);
});
test('unresolved submission remains blocked even when lookup cannot find an order',async()=>{
 const {store,broker}=await active();broker.submit=async()=>{broker.calls.push('submit');throw Error('lost');};broker.order=async()=>{throw new BrokerError('not-found');};
 await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+60000);const s=await practiceRead(store);assert.equal(s.active,false);assert.equal(s.fault,'entry-response-unknown');assert.ok(s.pending);await assert.rejects(practiceControl(store,cmd('start'),NOW));assert.equal(broker.calls.filter(c=>c==='submit').length,1);
});
test('pause preserves protection and emergency closes only owned trade',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+60000);await practiceControl(store,cmd('pause'),NOW);await practiceTick(store,broker,NOW+61000);assert.equal(broker.calls.includes('close'),false);
 await practiceControl(store,cmd('kill'),NOW);await practiceTick(store,broker,NOW+62000);assert.equal(broker.calls.filter(c=>c==='close').length,1);assert.equal((await practiceRead(store)).kill,true);
});
test('failed protective update requests closure and disables new entries',async()=>{
 const {store,broker}=await active();broker.failProtection=true;const r=await practiceTick(store,broker,NOW);assert.equal(r.active,false);assert.equal(r.fault,'protection-failed-close-requested');assert.ok(broker.calls.includes('close'));
});
test('closed bot P/L includes financing and commission once, never account-wide P/L',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+60000);
 broker.remote.state='CLOSED';broker.remote.closeTime=new Date(NOW+120000).toISOString();broker.remote.realizedPL='20';broker.remote.financing='-0.4';broker.remote.unrealizedPL='0';broker.a.pl='12345';broker.a.openTradeCount=0;broker.a.openPositionCount=0;broker.a.pendingOrderCount=0;
 broker.tx.push({id:'4',time:new Date(NOW+120000).toISOString(),type:'ORDER_FILL',price:'1.09',commission:'0.07',tradesClosed:[{tradeID:'3',units:'4464',price:'1.09',guaranteedExecutionFee:'0'}]});
 let r=await practiceTick(store,broker,NOW+120000);assert.equal(r.closed_trades,1);assert.equal(r.closed_pnl_usd,19.48);assert.equal(r.open_pnl_usd,0);assert.equal(r.research_equity_usd,1019.48);assert.equal(r.profit_factor,null);
 r=await practiceTick(store,broker,NOW+180000);assert.equal(r.closed_pnl_usd,19.48);
});
test('daily loss latches through recovery and only NY day rolls over',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+60000);broker.remote.unrealizedPL='-45';await practiceTick(store,broker,NOW+120000);assert.equal((await practiceRead(store)).dailyLocked,true);
 broker.remote.unrealizedPL='0';await practiceTick(store,broker,Date.parse('2026-10-13T03:59:00Z'));assert.equal((await practiceRead(store)).dailyLocked,true);
 await practiceTick(store,broker,Date.parse('2026-10-13T04:00:00Z'));assert.equal((await practiceRead(store)).dailyLocked,false);
});
test('spread, freshness, margin and account exposure block executable orders',()=>{
 const intent={units:4464,riskBudgetUsd:10,signalKey:'fixture'};
 const order=executableOrder(intent,price(),instrument(),account(),NOW);assert.equal(order.units,'-4464');assert.equal(order.stopLossOnFill.distance,'0.00200');assert.equal(order.timeInForce,'FOK');assert.equal(order.positionFill,'OPEN_ONLY');
 for(const p of [{...price(),status:'non-tradeable'},{...price(),time:new Date(NOW-15001).toISOString()},{...price(),asks:[{price:'1.10000'}]}])assert.throws(()=>executableOrder(intent,p,instrument(),account(),NOW));
 for(const a of [{...account(),openTradeCount:1},{...account(),pendingOrderCount:1},{...account(),marginAvailable:'0'}])assert.throws(()=>executableOrder(intent,price(),instrument(),a,NOW));
 const limited=executableOrder(intent,price(),instrument(),{...account(),marginAvailable:'10'},NOW);assert.ok(-Number(limited.units)*1.0991*.02<=9.5);
});
test('practice client rejects live IDs and arbitrary orders; writes only to fixed practice host',async()=>{
 const env={OANDA_PRACTICE_READ_ENABLED:'true',OANDA_PRACTICE_ACCOUNT_ID:account().id,OANDA_PRACTICE_TOKEN:'fixture-not-real'};
 assert.throws(()=>practiceBroker({...env,OANDA_PRACTICE_ACCOUNT_ID:'001-001-11111111-001'}));
 const calls=[],broker=practiceBroker(env,async(url,options)=>{calls.push({url,options});return Response.json({});});const order=executableOrder({units:4464,riskBudgetUsd:10,signalKey:'fixture'},price(),instrument(),account(),NOW);
 await assert.rejects(broker.submit({...order,units:'4464'}));await assert.rejects(broker.submit({...order,instrument:'GBP_USD'}));assert.equal(calls.length,0);
 await broker.submit(order);await broker.protect('3',1.099);await broker.close('3');for(const c of calls)assert.equal(new URL(c.url).origin,'https://api-fxpractice.oanda.com');assert.deepEqual(calls.map(c=>c.options.method),['POST','PUT','PUT']);
});
test('conditional storage with a lost write or missing ETag fails before any order',async()=>{
 const broken=new Store();broken.setJSON=async()=>({modified:true});await assert.rejects(practiceUpdate(broken,s=>{s.active=true;}));
 const missing=new Store();missing.data=initialPractice();missing.getWithMetadata=async()=>({data:initialPractice()});await assert.rejects(practiceUpdate(missing,s=>{s.active=true;}));
});
test('end of test closes owned position and prevents restart',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+60000);const end=Date.parse('2026-12-12T00:00:00Z');await practiceTick(store,broker,end);assert.ok(broker.calls.includes('close'));assert.equal((await practiceRead(store)).active,false);await assert.rejects(practiceControl(store,cmd('start'),end));
});
test('private production controls reject identity spoofing, previews and cross-origin writes',async()=>{
 const context={user:{id:'test-user'},deploy:{context:'production',published:true},site:{url:'https://example.netlify.app'}};
 for(const path of ['practice-engine','practice-command'])assert.equal((await handler(new Request('https://example.netlify.app/api/'+path,{headers:{'x-user-id':'spoof'}}),{...context,user:undefined})).status,401);
 const post=new Request('https://example.netlify.app/api/practice-command',{method:'POST',headers:{origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify(cmd('start'))});assert.equal((await handler(post,context)).status,403);
 assert.equal((await handler(new Request('https://example.netlify.app/api/practice-engine'),{...context,deploy:{context:'deploy-preview',published:false}})).status,403);
 assert.equal((await scheduled(null,{deploy:{context:'deploy-preview',published:false}})).status,204);
});
test('rejected market order reconciles the claim and never replays the same signal',async()=>{
 const {store,broker}=await active();broker.submit=async order=>{broker.calls.push('submit');const tx={id:'2',time:new Date(NOW).toISOString(),type:'MARKET_ORDER_REJECT',clientExtensions:order.clientExtensions};broker.tx.push(tx);return {orderRejectTransaction:tx};};
 await practiceTick(store,broker,NOW);await practiceTick(store,broker,NOW+1000);assert.equal((await practiceRead(store)).pending,null);assert.equal(broker.calls.filter(c=>c==='submit').length,1);
});
test('financial evidence missing commission fails closed instead of inventing zero cost',async()=>{
 const {store,broker}=await active();await practiceTick(store,broker,NOW);delete broker.tx[0].commission;const r=await practiceTick(store,broker,NOW+60000);assert.equal(r.active,false);assert.ok(r.fault);assert.equal(r.pending_status,'submitting');
});
