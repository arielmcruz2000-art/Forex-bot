// Pure research evaluator. No fetch, credentials, order payload or routing.
const START=Date.parse('2026-10-12T00:00:00Z'),END=Date.parse('2026-12-12T00:00:00Z');
const ny=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',hourCycle:'h23'});
export function evaluatePracticeIntent(snapshot,state,now=Date.now()) {
  const base={mode:'research-dry-run',data_source:'market-data',execution_enabled:false,order_routing_enabled:false};
  const block=reason=>({...base,status:'blocked',reason});
  if(snapshot?.environment!=='practice'||snapshot.instrument!=='EUR_USD'||snapshot.granularity!=='M15'||snapshot.currency!=='USD'||snapshot.read_connected!==true||snapshot.execution_enabled!==false||snapshot.order_routing_enabled!==false)return block('unverified-practice-snapshot');
  if(!Number.isFinite(now))return block('invalid-clock');
  const candles=snapshot.candles;
  if(!Array.isArray(candles)||candles.length<21)return block('insufficient-sma-warmup');
  const times=candles.map(c=>Date.parse(c.time));
  if(candles.some((c,i)=>c.complete!==true||!Number.isFinite(times[i])||times[i]%900000!==0||!Number.isFinite(c.close)||c.close<=0||(i>0&&times[i]<=times[i-1])))return block('invalid-candles');
  const closeAt=times.at(-1)+900000;
  if(times.at(-1)<START||closeAt>=END)return block('outside-test-window');
  // Never create an intent late from an old close (including weekend data).
  if(now<closeAt||now-closeAt>90000)return block('stale-or-future-signal');
  if(times.at(-1)-times.at(-2)!==900000)return block('nonconsecutive-signal-bars');
  const parts=Object.fromEntries(ny.formatToParts(closeAt).map(p=>[p.type,p.value]));
  const day=`${parts.year}-${parts.month}-${parts.day}`;
  if(!['Mon','Tue','Wed','Thu','Fri'].includes(parts.weekday)||Number(parts.hour)<7||Number(parts.hour)>=12)return block('outside-ny-session');
  // Caller must supply reconciled research ledger; no implicit midnight reset.
  if(!state||state.day!==day||!Number.isFinite(state.researchEquity)||state.researchEquity<=0||!Number.isFinite(state.dayStartEquity)||state.dayStartEquity<=0||typeof state.dailyLocked!=='boolean'||!Number.isInteger(state.openPositions)||state.openPositions<0)return block('risk-ledger-required');
  if(state.dailyLocked||(state.dayStartEquity-state.researchEquity)/state.dayStartEquity>=0.04)return {...block('daily-loss-lock'),dailyLocked:true};
  if([snapshot.open_trade_count,snapshot.open_position_count,snapshot.pending_order_count].some(n=>!Number.isInteger(n)||n<0))return block('unknown-account-exposure');
  if(state.openPositions!==0||snapshot.open_trade_count!==0||snapshot.open_position_count!==0||snapshot.pending_order_count!==0)return block('existing-exposure');
  const signalKey=`EUR_USD:M15:${new Date(closeAt).toISOString()}:short`;
  if(state.lastSignalKey===signalKey)return block('duplicate-signal');
  const mean=(end,n)=>candles.slice(end-n,end).reduce((s,c)=>s+c.close,0)/n;
  const n=candles.length;
  if(!(mean(n-1,5)>=mean(n-1,20)&&mean(n,5)<mean(n,20)))return {...base,status:'no-signal'};
  if(!Number.isFinite(snapshot.equity)||snapshot.equity<=0||state.researchEquity>snapshot.equity)return block('insufficient-account-equity');
  // Frozen Pine proxy: stop + two-side commission + four minimum ticks.
  const riskPerUnit=0.002+0.0002+4*0.00001;
  const riskBudget=state.researchEquity*0.01;
  const units=Math.floor(Math.min(riskBudget/riskPerUnit,state.researchEquity*0.95/(candles.at(-1).close*0.02)));
  if(units<1)return block('position-below-one-unit');
  return {...base,status:'candidate',signalKey,direction:'short',units,riskBudgetUsd:riskBudget,modeledStopRiskUsd:units*riskPerUnit,stopPips:20,targetPips:60,signalCloseUtc:new Date(closeAt).toISOString(),dailyLocked:false,notes:'Sizing uses frozen Pine cost proxies, not executable bid/ask. Entry would be at a later fill; protective prices require that fill. Financing and gap risk are not modeled.'};
}
