import {getStore} from '@netlify/blobs';
// SDK 11.1.4 reports success for some failed conditional writes. Reject HTTP
// errors in its fetch transport and require a strong read-back of each revision.
export const practiceStore=()=>getStore({name:'forex-oanda-practice-v1',consistency:'strong',fetch:async(...args)=>{
  const r=await fetch(...args);if(!r.ok&&r.status!==404&&r.status!==412)throw Error('practice-storage-unavailable');return r;
}});
export const initialPractice=()=>({version:1,active:false,kill:false,initialized:false,preflight:false,accountBinding:null,revision:null,lease:null,pending:null,trades:[],events:[],account:null,lastTick:null,lastSignalKey:null,day:null,dayStartEquity:1000,dailyLocked:false,lastEquity:1000,peakEquity:1000,maxDrawdownPct:0,baselineTransaction:null,cursor:null,fault:null,commands:[],lastDecision:null});
export async function practiceRead(store){const r=await store.getWithMetadata('state',{type:'json',consistency:'strong'});return r?.data??initialPractice();}
export async function practiceUpdate(store,fn){
  for(let i=0;i<8;i++){
    const r=await store.getWithMetadata('state',{type:'json',consistency:'strong'});const s=r?.data??initialPractice();
    if(r&&(!r.etag||typeof r.etag!=='string'))throw Error('practice-storage-missing-etag');
    if(fn(s)===false)return s;
    s.revision=crypto.randomUUID();const out=await store.setJSON('state',s,r?{onlyIfMatch:r.etag}:{onlyIfNew:true});
    if(!out.modified)continue;
    const saved=await practiceRead(store);if(saved.revision!==s.revision)throw Error('practice-storage-race');return saved;
  }
  throw Error('practice-storage-busy');
}
export function event(s,code,now){s.events.push({time:new Date(now).toISOString(),code});if(s.events.length>500)s.events.shift();}
