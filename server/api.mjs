import {command,snapshot} from './paper.mjs';
import {read,update,stateStore} from './storage.mjs';
import {practiceSnapshot} from './oanda-practice.mjs';
import {practiceStore,practiceRead} from './practice-storage.mjs';
import {practiceBroker} from './practice-broker.mjs';
import {practiceReport,practiceControl,practiceTick} from './practice-engine.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function handler(req,context,storeFactory=stateStore,now=Date.now()) {
  // Verified by Netlify private-project login. Never trust client identity headers.
  if(!context.user?.id)return json({error:'Inicia sesión en el proyecto privado de Netlify.'},401);
  if(context.deploy?.context!=='production'||context.deploy?.published!==true)return json({error:'Usa el panel de producción publicado.'},403);
  const path=new URL(req.url).pathname;
  if(path==='/api/practice-engine'&&req.method==='GET'){
    try{return json(practiceReport(await practiceRead(practiceStore()),now));}catch{return json({error:'No se puede confirmar el estado de la demo.'},503);}
  }
  if(path==='/api/practice-command'&&req.method==='POST'){
    if(req.headers.get('origin')!==new URL(context.site.url).origin||req.headers.get('sec-fetch-site')==='cross-site')return json({error:'Origen no autorizado.'},403);
    if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Se requiere JSON.'},415);
    try{
      const body=await req.text();if(body.length>2048)return json({error:'Comando demasiado grande.'},413);
      const payload=JSON.parse(body),store=practiceStore();
      if(payload.action==='check')return json(await practiceTick(store,practiceBroker(),now));
      const s=await practiceControl(store,payload,now);return json(practiceReport(s,now));
    }catch{return json({error:'No se confirmó el comando demo. Actualiza el informe; no repitas una entrada incierta.'},409);}
  }
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
