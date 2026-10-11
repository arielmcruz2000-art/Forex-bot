import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,open,step,command,scheduled,snapshot} from '../server/paper.mjs';
import {read,update} from '../server/storage.mjs';
import {handler} from '../server/api.mjs';
const now=Date.parse('2026-10-11T03:00:00Z');
const cmd=(action,extra={})=>({action,id:crypto.randomUUID(),...extra});
class FakeStore {
  data=null;rev=0;
  async getWithMetadata(){return this.data?{data:structuredClone(this.data),etag:String(this.rev)}:null;}
  async setJSON(_key,data,opts){if(opts.onlyIfNew&&this.data||opts.onlyIfMatch&&opts.onlyIfMatch!==String(this.rev))return {modified:false};this.data=structuredClone(data);this.rev++;return {modified:true,etag:String(this.rev)};}
}
test('position sizing includes buffer; exposure cannot exceed 2%',()=>{
  const s=initial(now);command(s,cmd('start'),now);assert.equal(open(s,1,now),true);assert.equal(s.trades[0].units,4878);assert.equal(open(s,-1,now),true);assert.equal(open(s,1,now),false);
  const s2=initial(now);s2.active=true;s2.risk=1.5;assert.equal(open(s2,1,now),true);assert.equal(open(s2,-1,now),false);
});
test('pause blocks entries but protective short exit still runs, including spread',()=>{
  const s=initial(now);s.active=true;open(s,-1,now);command(s,cmd('pause'),now);assert.equal(open(s,1,now),false);step(s,now,1.092);
  assert.equal(s.trades.length,1);step(s,now,1.090);assert.equal(s.trades.length,0);assert.equal(s.history[0].reason,'Objetivo');assert.ok(Math.abs(s.history[0].exit-1.09005)<1e-10);assert.ok(s.balance>1000);
});
test('daily equity drawdown disables entries and rejects restart',()=>{
  const s=initial(now);s.balance=950;s.active=true;step(s,now,1.095);assert.equal(s.active,false);assert.throws(()=>command(s,cmd('start'),now));
});
test('closed-browser scheduling is once per slot; paused flat state is idle',()=>{
  const s=initial(now);assert.equal(scheduled(s,now),false);s.active=true;assert.equal(scheduled(s,now),true);assert.equal(scheduled(s,now+1000),false);assert.equal(s.tick,1);assert.equal(scheduled(s,now+60000),true);
});
test('replayed command never advances twice; invalid risks and actions do not pass',()=>{
  const s=initial(now),c=cmd('step');command(s,c,now);assert.equal(command(s,c,now),false);assert.equal(s.tick,1);
  for(const risk of [NaN,Infinity,0,3,'1'])assert.throws(()=>command(s,cmd('config',{risk}),now));
  assert.throws(()=>command(s,cmd('open-real'),now));assert.equal(snapshot(s).broker_connected,false);assert.equal(snapshot(s).commands,undefined);
});
test('concurrent mutations retain both updates; state survives separate readers',async()=>{
  const store=new FakeStore();await update(store,s=>command(s,cmd('start'),now),now);
  await Promise.all([update(store,s=>command(s,{action:'step',id:'same-command-0001'},now),now),update(store,s=>command(s,{action:'step',id:'same-command-0001'},now),now)]);
  assert.equal((await read(store,now)).tick,1);
  await Promise.all([update(store,s=>command(s,cmd('pause'),now),now),update(store,s=>command(s,cmd('config',{risk:.5}),now),now)]);
  const saved=await read(store,now);assert.equal(saved.active,false);assert.equal(saved.risk,.5);
});
test('API fails closed for public/preview deployment, client identity headers and cross-origin commands',async()=>{
  const store=new FakeStore(),factory=()=>store,context={user:{id:'verified-user'},deploy:{context:'production',published:true},site:{url:'https://example.netlify.app'}};
  const get=()=>new Request('https://example.netlify.app/api/state',{headers:{'x-user-id':'fake'}});
  assert.equal((await handler(get(),{...context,user:undefined},factory,now)).status,401);
  assert.equal((await handler(get(),{...context,deploy:{context:'deploy-preview',published:false}},factory,now)).status,403);
  assert.equal((await handler(get(),context,factory,now)).status,200);
  const post=origin=>new Request('https://example.netlify.app/api/command',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(cmd('start'))});
  assert.equal((await handler(post('https://evil.example'),context,factory,now)).status,403);assert.equal(store.data,null);
  assert.equal((await handler(post(context.site.url),context,factory,now)).status,200);assert.equal(store.data.active,true);
});
