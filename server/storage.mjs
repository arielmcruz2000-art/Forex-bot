import {getStore} from '@netlify/blobs';
import {initial} from './paper.mjs';
export const stateStore=()=>getStore({name:'forex-paper-v1',consistency:'strong'});
export async function read(store,now=Date.now()) {
  const record=await store.getWithMetadata('state',{type:'json',consistency:'strong'});
  return record?.data??initial(now);
}
// Optimistic concurrency: retry the pure mutation against the latest revision.
export async function update(store,mutate,now=Date.now()) {
  for(let attempt=0;attempt<6;attempt++) {
    const record=await store.getWithMetadata('state',{type:'json',consistency:'strong'});
    const state=record?.data??initial(now);
    if(mutate(state)===false)return state;
    const result=await store.setJSON('state',state,record?{onlyIfMatch:record.etag}:{onlyIfNew:true});
    if(result.modified)return state;
  }
  const error=Error('Otro cambio está en curso. Vuelve a intentar.');error.status=409;throw error;
}
