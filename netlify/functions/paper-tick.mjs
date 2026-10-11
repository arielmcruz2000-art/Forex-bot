import {scheduled} from '../../server/paper.mjs';
import {stateStore,update} from '../../server/storage.mjs';
export default async (_req,context) => {
  if(context.deploy?.context!=='production'||context.deploy?.published!==true)return new Response(null,{status:204});
  const now=Date.now();await update(stateStore(),s=>scheduled(s,now),now);
  return new Response(null,{status:204});
};
// Netlify invokes this on published production only; not an HTTP endpoint.
export const config={schedule:'* * * * *'};
