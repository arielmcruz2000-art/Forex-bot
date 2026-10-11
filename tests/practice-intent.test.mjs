import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePracticeIntent as evaluate} from '../server/practice-intent.mjs';
const start=Date.parse('2026-10-12T06:00:00Z');
const candles=Array.from({length:21},(_,i)=>({time:new Date(start+i*900000).toISOString(),close:i===20?1.099:1.1,complete:true}));
const now=start+21*900000;
const snapshot={environment:'practice',instrument:'EUR_USD',granularity:'M15',currency:'USD',read_connected:true,execution_enabled:false,order_routing_enabled:false,equity:100000,open_trade_count:0,open_position_count:0,pending_order_count:0,candles};
const state={day:'2026-10-12',researchEquity:1000,dayStartEquity:1000,dailyLocked:false,openPositions:0,lastSignalKey:null};
test('short crossover uses research capital, 1% cost-aware risk and disabled routing',()=>{
 const r=evaluate(snapshot,state,now);assert.equal(r.status,'candidate');assert.equal(r.riskBudgetUsd,10);assert.equal(r.units,4464);assert.ok(r.modeledStopRiskUsd<=10);assert.equal(r.stopPips,20);assert.equal(r.targetPips,60);assert.equal(r.execution_enabled,false);assert.equal(r.order_routing_enabled,false);
});
test('4% daily loss and persistent latch block despite equity recovery',()=>{
 for(const s of [{...state,researchEquity:960},{...state,dailyLocked:true,researchEquity:1100}])assert.equal(evaluate(snapshot,s,now).reason,'daily-loss-lock');
 assert.equal(evaluate(snapshot,{...state,researchEquity:960.01},now).status,'candidate');
});
test('all account exposure and duplicate signals block',()=>{
 for(const field of ['open_trade_count','open_position_count','pending_order_count'])assert.equal(evaluate({...snapshot,[field]:1},state,now).reason,'existing-exposure');
 assert.equal(evaluate(snapshot,{...state,openPositions:1},now).reason,'existing-exposure');
 const signalKey=evaluate(snapshot,state,now).signalKey;assert.equal(evaluate(snapshot,{...state,lastSignalKey:signalKey},now).reason,'duplicate-signal');
});
test('missing risk ledger, unknown exposure, incomplete history and live mode fail closed',()=>{
 for(const s of [null,{...state,day:'2026-10-11'},{...state,researchEquity:NaN}])assert.equal(evaluate(snapshot,s,now).reason,'risk-ledger-required');
 assert.equal(evaluate({...snapshot,open_trade_count:undefined},state,now).reason,'unknown-account-exposure');
 assert.equal(evaluate({...snapshot,candles:candles.slice(1)},state,now).reason,'insufficient-sma-warmup');
 assert.equal(evaluate({...snapshot,environment:'live'},state,now).reason,'unverified-practice-snapshot');
 assert.equal(evaluate({...snapshot,candles:[...candles.slice(0,-1),{...candles.at(-1),complete:false}]},state,now).reason,'invalid-candles');
});
test('freshness, date window, session close and direction are enforced',()=>{
 assert.equal(evaluate(snapshot,state,now+90001).reason,'stale-or-future-signal');
 const shifted=offset=>({...snapshot,candles:candles.map(c=>({...c,time:new Date(Date.parse(c.time)+offset).toISOString()}))});
 assert.equal(evaluate(shifted(-86400000),state,now-86400000).reason,'outside-test-window');
 assert.equal(evaluate(shifted(5*3600000),state,now+5*3600000).reason,'outside-ny-session');
 assert.equal(evaluate({...snapshot,candles:candles.map(c=>({...c,close:1.1}))},state,now).status,'no-signal');
});
test('margin reserve and minimum unit protect small or constrained research ledgers',()=>{
 const expensive={...snapshot,candles:candles.map((c,i)=>({...c,close:i===20?399:400}))};
 const r=evaluate(expensive,state,now);assert.equal(r.status,'candidate');assert.ok(r.units*399*0.02<=950);
 assert.equal(evaluate(snapshot,{...state,researchEquity:0.01,dayStartEquity:0.01},now).reason,'position-below-one-unit');
});
