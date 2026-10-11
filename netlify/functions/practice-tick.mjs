import {practiceStore} from '../../server/practice-storage.mjs';
import {practiceBroker} from '../../server/practice-broker.mjs';
import {practiceTick} from '../../server/practice-engine.mjs';
export function createScheduledPractice({storeFactory=practiceStore,brokerFactory=practiceBroker,tick=practiceTick}={}){
  return async(_req,context)=>{
    // Native scheduled invocations are not HTTP routes and only run on the
    // current published deploy. Netlify supplies published=false for them.
    // Explicitly reject previews/manual branch invocations by trusted context.
    if(context.deploy?.context!=='production')return new Response(null,{status:204});
    try{await tick(storeFactory(),brokerFactory());return new Response(null,{status:204});}
    catch{return new Response(null,{status:503});}
  };
}
export default createScheduledPractice();
export const config={schedule:'* * * * *'};
