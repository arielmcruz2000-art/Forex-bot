import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../dist/practice-engine.js',import.meta.url),'utf8');
const report={mode:'oanda-practice-engine',environment:'practice',real_execution_enabled:false,active:true,initialized:true,heartbeat_stale:false,last_tick_utc:'2026-10-12T12:00:00Z',closed_pnl_usd:12,open_pnl_usd:null,research_equity_usd:1012,closed_trades:1,open_trades:0,drawdown_observed_pct:1,profit_factor:null,daily_locked:false,trades:[]};
const response=(data=report)=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>data});
function panel(fetch){
 const elements=new Map();
 const element=()=>({textContent:'',disabled:false,children:[],attributes:{},setAttribute(k,v){this.attributes[k]=v;},append(...xs){this.children.push(...xs);},replaceChildren(...xs){this.children=xs;}});
 const doc={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element};
 let interval;
 const context=vm.createContext({document:doc,fetch,AbortController,setTimeout,clearTimeout,setInterval(fn){interval=fn;},crypto:{randomUUID:()=> 'test-command'},go(){},money:n=> '$'+n,row(body,values){body.append(values);}});
 // Exclude the automatic initial read so each request under test is awaited explicitly.
 vm.runInContext(source.replace("go('practice');practiceRefresh();", "go('practice');"),context);
 return {context,el:id=>doc.getElementById(id),refresh:()=>vm.runInContext('practiceRefresh()',context),poll:()=>interval()};
}
test('refresh reads GET only, gives visible completion, and preserves unknown open P/L',async()=>{
 const calls=[];const p=panel(async(url,options)=>{calls.push({url,options});return response();});
 await p.refresh();assert.equal(calls[0].url,'/api/practice-engine');assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.body,undefined);
 assert.match(p.el('practice-message').textContent,/Informe actualizado/);assert.equal(p.el('practice-open').textContent,'Sin datos');assert.equal(p.el('practice-refresh').disabled,false);
});
test('in-flight refresh shows loading, blocks duplicate GETs and restores the button',async()=>{
 let finish;let calls=0;const p=panel(()=>{calls++;return new Promise(resolve=>finish=resolve);});
 const running=p.refresh();assert.equal(p.el('practice-refresh').disabled,true);assert.match(p.el('practice-refresh').textContent,/Actualizando/);
 await p.refresh();assert.equal(calls,1);finish(response());await running;assert.equal(p.el('practice-refresh').attributes['aria-busy'],'false');
});
test('expired login clears stale current metrics without reporting a stopped engine',async()=>{
 let expired=false;const p=panel(async()=>expired?{status:401,headers:{get:()=> 'text/html'}}:response());
 await p.refresh();expired=true;await p.refresh();assert.match(p.el('practice-message').textContent,/Inicia sesión/);
 assert.equal(p.el('practice-closed').textContent,'Sin datos actuales');assert.equal(p.el('practice-export').disabled,true);assert.match(p.el('practice-decision').textContent,/no confirma/);
});
test('timeout and network errors produce actionable feedback and release loading state',async()=>{
 for(const error of [Object.assign(new Error('aborted'),{name:'AbortError'}),new TypeError('fetch failed')]){
  const p=panel(async()=>{throw error;});await p.refresh();assert.match(p.el('practice-message').textContent,/35 segundos|conectar con el servidor/);assert.equal(p.el('practice-refresh').disabled,false);
 }
});
test('reading a stale heartbeat warns rather than claiming a fresh engine cycle',async()=>{
 const p=panel(async()=>response({...report,heartbeat_stale:true}));await p.refresh();assert.match(p.el('practice-message').textContent,/antiguo o sin confirmar/);
});
