import {command,snapshot} from './paper.mjs';
import {read,update,stateStore} from './storage.mjs';
import {practiceSnapshot} from './oanda-practice.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function handler(req,context,storeFactory=stateStore,now=Date.now()) {
  // Verified by Netlify private-project login. Never trust client identity headers.
  if(!context.user?.id)return json({error:'Inicia sesión en el proyecto privado de Netlify.'},401);
  if(context.deploy?.context!=='production'||context.deploy?.published!==true)return json({error:'Usa el panel de producción publicado.'},403);
  const path=new URL(req.url).pathname;
  if(req.method==='GET'&&path==='/api/oanda-practice') {
    const result=await practiceSnapshot();return json(result.data??{error:result.error},result.status);
  }
  if(req.method==='GET'&&path==='/api/state') {
    try{return json(snapshot(await read(storeFactory(),now)));}catch{return json({error:'No se pudo leer el estado persistente.'},503);}
  }
  if(req.method!=='POST'||path!=='/api/command')return json({error:'Ruta o método no permitido.'},405);
  if(req.headers.get('origin')!==new URL(context.site.url).origin||req.headers.get('sec-fetch-site')==='cross-site')return json({error:'Origen no autorizado.'},403);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Se requiere JSON.'},415);
  let payload;
  try {const body=await req.text();if(body.length>2048)return json({error:'Comando demasiado grande.'},413);payload=JSON.parse(body);if(!payload||Array.isArray(payload))throw Error();}catch{return json({error:'Comando inválido.'},400);}
  try{return json(snapshot(await update(storeFactory(),s=>command(s,payload,now),now)));}
  catch(error){return json({error:error.status===409?error.message:'No se aplicó el comando. Verifica la acción, el riesgo y el límite diario.'},error.status??400);}
}
