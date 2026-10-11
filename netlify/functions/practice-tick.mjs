import {practiceStore} from '../../server/practice-storage.mjs';
import {practiceBroker} from '../../server/practice-broker.mjs';
import {practiceTick} from '../../server/practice-engine.mjs';
export default async (_req,context)=>{
  console.info('practice-scheduled-guard',JSON.stringify({context:context.deploy?.context??null,published:context.deploy?.published??null}));
  if(context.deploy?.context!=='production'||context.deploy?.published!==true)return new Response(null,{status:204});
  try{await practiceTick(practiceStore(),practiceBroker());return new Response(null,{status:204});}
  catch{return new Response(null,{status:503});}
};
export const config={schedule:'* * * * *'};
