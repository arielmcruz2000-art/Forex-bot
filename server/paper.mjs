// Educational simulation: generated prices only; no broker client or orders.
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
const day = now => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export function initial(now=Date.now()) {
  return {version:1,active:false,risk:1,balance:1000,trades:[],history:[],events:[],tick:0,prices:[],price:1.095,day:day(now),day_equity:1000,last_slot:-1,last_tick:null,commands:[]};
}
const pnl = (s,t) => (s.price-t.direction*.00005-t.entry)*t.direction*t.units;
const equity = s => s.balance+s.trades.reduce((a,t)=>a+pnl(s,t),0);
const loss = s => s.day_equity>0?Math.max(0,(s.day_equity-equity(s))/s.day_equity*100):100;
const event = (s,message,now) => {s.events.unshift(new Date(now).toISOString()+' · '+message);s.events=s.events.slice(0,40);};
function rollover(s,now) {if(s.day!==day(now)){s.day=day(now);s.day_equity=equity(s);}}
export function open(s,direction,now=Date.now()) {
  if(![1,-1].includes(direction))throw Error('Dirección inválida');
  if(!s.active||s.trades.length>=2||s.trades.reduce((a,t)=>a+t.risk,0)+s.risk>2+1e-9||loss(s)>=4||equity(s)<=0)return false;
  // USD account, USD-quoted pair; include conservative cost buffer in sizing.
  const units=Math.floor(equity(s)*s.risk/100/.00205);
  if(units<=0)return false;
  const entry=s.price+direction*.00005;
  s.trades.push({direction,units,entry,stop:entry-direction*.002,target:entry+direction*.004,risk:s.risk});
  event(s,'Posición simulada abierta: '+(direction===1?'compra':'venta'),now);return true;
}
function close(s,t,reason,now) {
  const profit=round(pnl(s,t));s.balance=round(s.balance+profit);
  s.history.unshift({...t,profit,exit:s.price-t.direction*.00005,reason,time:new Date(now).toISOString()});
  s.history=s.history.slice(0,1000);s.trades.splice(s.trades.indexOf(t),1);event(s,'Cierre simulado: '+reason,now);
}
export function step(s,now=Date.now(),price) {
  if(price!==undefined&&(!Number.isFinite(price)||price<=0))throw Error('Precio inválido');
  rollover(s,now);s.tick++;
  s.price=Number((price??1.095+.003*Math.sin(s.tick/15)+.0002*Math.sin(s.tick/3)).toFixed(5));
  s.prices.push(s.price);s.prices=s.prices.slice(-100);s.last_tick=new Date(now).toISOString();
  for(const t of [...s.trades]) {
    const exit=s.price-t.direction*.00005;
    const stop=t.direction===1?exit<=t.stop:exit>=t.stop;
    const target=t.direction===1?exit>=t.target:exit<=t.target;
    if(stop||target)close(s,t,stop?'Stop':'Objetivo',now);
  }
  if(loss(s)>=4){if(s.active)event(s,'Límite diario alcanzado. Entradas suspendidas.',now);s.active=false;}
  const p=s.prices,mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  if(p.length>=21&&s.active&&!s.trades.length){
    const previous=mean(p.slice(-6,-1))-mean(p.slice(-21,-1));
    const current=mean(p.slice(-5))-mean(p.slice(-20));
    if(previous<=0&&current>0)open(s,1,now);
    else if(previous>=0&&current<0)open(s,-1,now);
  }
}
export function command(s,{action,risk,id},now=Date.now()) {
  if(typeof id!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(id))throw Error('Identificador de comando inválido');
  if(s.commands.includes(id))return false;
  rollover(s,now);
  if(action==='start'){if(loss(s)>=4)throw Error('Límite diario alcanzado');s.active=true;event(s,'Entradas automáticas simuladas activadas',now);}
  else if(action==='pause'){s.active=false;event(s,'Entradas pausadas; las salidas protectoras continúan',now);}
  else if(action==='close'){s.active=false;for(const t of [...s.trades])close(s,t,'Cierre manual',now);}
  else if(action==='config'){if(typeof risk!=='number'||!Number.isFinite(risk)||risk<.1||risk>2)throw Error('Riesgo permitido: 0.1% a 2%');s.risk=risk;event(s,'Riesgo actualizado a '+risk+'%',now);}
  else if(action==='step')step(s,now);
  else throw Error('Acción desconocida');
  s.commands.push(id);s.commands=s.commands.slice(-200);return true;
}
export function scheduled(s,now=Date.now()) {
  const slot=Math.floor(now/60000);
  if(slot<=s.last_slot||(!s.active&&!s.trades.length))return false;
  step(s,now);s.last_slot=slot;return true;
}
export function snapshot(s) {
  const {commands,...publicState}=s;
  return {...publicState,equity:round(equity(s)),loss_percent:round(loss(s)),mode:'generated-paper',broker_connected:false,backend:'netlify',interval_seconds:60,trades:s.trades.map(t=>({...t,profit:round(pnl(s,t))}))};
}
