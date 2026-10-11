import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceSnapshot} from '../server/oanda-practice.mjs';
import {handler} from '../server/api.mjs';
const account='101-001-12345678-001';
const env={OANDA_PRACTICE_READ_ENABLED:'true',OANDA_PRACTICE_TOKEN:'fake-secret-not-a-credential',OANDA_PRACTICE_ACCOUNT_ID:account};
const summary={account:{id:account,currency:'USD',balance:'100000',NAV:'100000',pl:'0',unrealizedPL:'0',openTradeCount:0,openPositionCount:0,pendingOrderCount:0}};
const series={instrument:'EUR_USD',granularity:'M15',candles:[{time:'2026-10-09T20:45:00Z',complete:true,mid:{o:'1.1',h:'1.11',l:'1.09',c:'1.105'}},{time:'2026-10-09T21:00:00Z',complete:false}]};
test('disabled, missing token and live account IDs never contact OANDA',async()=>{
 let calls=0;const fetcher=()=>{calls++;throw Error();};
 for(const config of [{...env,OANDA_PRACTICE_READ_ENABLED:'false'},{...env,OANDA_PRACTICE_TOKEN:''},{...env,OANDA_PRACTICE_ACCOUNT_ID:'001-001-12345678-001'}])assert.equal((await practiceSnapshot(config,fetcher)).status,409);
 assert.equal(calls,0);
});
test('only GET to fixed practice host; output excludes credentials, account ID and incomplete candles',async()=>{
 const calls=[];const result=await practiceSnapshot(env,async(url,options)=>{calls.push({url,options});return Response.json(url.includes('/summary')?summary:series);});
 assert.equal(result.status,200);assert.equal(result.data.execution_enabled,false);assert.equal(result.data.candles.length,1);
 for(const c of calls){assert.equal(new URL(c.url).origin,'https://api-fxpractice.oanda.com');assert.equal(c.options.method,'GET');assert.equal(c.options.redirect,'error');}
 assert.equal(JSON.stringify(result).includes(env.OANDA_PRACTICE_TOKEN),false);assert.equal(JSON.stringify(result).includes(account),false);
});
test('failed access and invalid responses fail closed and do not expose upstream details',async()=>{
 for(const fetcher of [async()=>{throw Error(env.OANDA_PRACTICE_TOKEN);},async()=>new Response(env.OANDA_PRACTICE_TOKEN,{status:401}),async()=>Response.json({account:{...summary.account,id:'wrong'}})]){
  const r=await practiceSnapshot(env,fetcher);assert.equal(r.status,502);assert.equal(JSON.stringify(r).includes(env.OANDA_PRACTICE_TOKEN),false);
 }
});
test('invalid candle prices and unordered times are rejected',async()=>{
 for(const candles of [[{...series.candles[0],mid:{o:'1.1',h:'1.0',l:'1.09',c:'1.105'}}],[series.candles[0],series.candles[0]]]){
  assert.equal((await practiceSnapshot(env,async url=>Response.json(url.includes('/summary')?summary:{...series,candles}))).status,502);
 }
});
test('private production API rejects unauthorized reads, previews and write methods',async()=>{
 const url='https://example.netlify.app/api/oanda-practice',context={user:{id:'verified'},deploy:{context:'production',published:true},site:{url:'https://example.netlify.app'}};
 assert.equal((await handler(new Request(url),{})).status,401);
 assert.equal((await handler(new Request(url),{...context,deploy:{context:'deploy-preview'}})).status,403);
 assert.equal((await handler(new Request(url,{method:'POST'}),context)).status,405);
});
