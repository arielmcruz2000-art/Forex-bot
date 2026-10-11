'use strict';
let practiceData=null,practiceBusy=false;
const practiceReason={
 'outside-test-window':'Esperando el inicio del ensayo: 12 de octubre de 2026.',
 'outside-ny-session':'Esperando la sesión de lunes a viernes, 07:00–12:00 Nueva York.',
 'stale-or-future-signal':'Esperando una vela M15 recién cerrada; no se opera con señales antiguas.',
 'daily-loss-lock':'Entradas bloqueadas por el límite diario del 4%.',
 'duplicate-signal':'Señal ya registrada; no se repite la entrada.',
 'existing-exposure':'Hay exposición u órdenes en la cuenta; no se abre otra posición.',
 'entry-response-unknown':'Respuesta de entrada incierta. Pausado hasta conciliar; no se repite la orden.',
 'practice-check-failed':'No se pudo verificar la cuenta o el mercado. No se abren entradas nuevas.',
 'protection-failed-close-requested':'Protección sin confirmar; cierre de la posición del bot solicitado.',
 'stale-price-or-wide-spread':'Entrada bloqueada por precio antiguo o spread superior a 2 pips.'
};
async function practiceApi(payload){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
 try{const r=await fetch(payload?'/api/practice-command':'/api/practice-engine',{method:payload?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify({...payload,id:crypto.randomUUID()}):undefined,signal:controller.signal});
  if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Comprueba tu sesión privada de Netlify.');const d=await r.json();if(!r.ok)throw Error(d.error||'Demo sin confirmar.');
  if(d.mode!=='oanda-practice-engine'||d.environment!=='practice'||d.real_execution_enabled!==false)throw Error('Respuesta demo inesperada.');return d;
 }finally{clearTimeout(timer);}
}
function practiceDraw(d){
 const el=id=>document.getElementById(id),value=n=>n==null?'Sin datos':money(n);
 el('practice-status').textContent=d.fault?'Bloqueado: '+(practiceReason[d.fault]||d.fault):d.kill?'Parada de emergencia activada':d.active?'Motor OANDA Demo activo · ejecución con dinero real bloqueada':'Entradas OANDA Demo pausadas';
 el('practice-decision').textContent=(d.last_decision?.reason?(practiceReason[d.last_decision.reason]||d.last_decision.reason):d.last_decision?.status==='no-signal'?'Esperando un cruce SMA5/20 bajista.':'Esperando el próximo ciclo de comprobación.')+(d.heartbeat_stale?' El último ciclo no está confirmado recientemente.':'');
 el('practice-closed').textContent=value(d.closed_pnl_usd);el('practice-open').textContent=value(d.open_pnl_usd);el('practice-equity').textContent=value(d.research_equity_usd);el('practice-count').textContent=d.closed_trades==null?'Sin datos':d.closed_trades+' cerradas · '+d.open_trades+' abiertas';
 el('practice-summary').replaceChildren();for(const [label,v] of [['Último ciclo UTC',d.last_tick_utc??'Sin confirmar'],['Drawdown observado',d.drawdown_observed_pct==null?'Sin datos':d.drawdown_observed_pct.toFixed(2)+'%'],['Profit factor',d.profit_factor==null?'Muestra insuficiente':d.profit_factor.toFixed(3)],['Bloqueo diario',d.daily_locked?'Sí':'No'],['Costes realizados de posiciones abiertas',value(d.open_trade_realized_costs_usd)],['Saldo completo de la cuenta demo',value(d.account?.balance)],['Equity completa de la cuenta demo',value(d.account?.equity)]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(v);el('practice-summary').append(dt,dd);}
 el('practice-trades').replaceChildren();for(const t of d.trades){row(el('practice-trades'),[t.entryTime,t.state==='OPEN'?'Abierta':'Cerrada',t.units,t.entry.toFixed(5),t.stop?.toFixed(5)??'—',t.target?.toFixed(5)??'—',t.exitTime??'—',value(t.realizedPL+t.financing-t.commission-t.guaranteedFee),value(t.unrealizedPL)]);}if(!d.trades.length)row(el('practice-trades'),[d.initialized?'Sin operaciones del bot registradas.':'Historial sin verificar.']);
 el('practice-start').disabled=!d.initialized||d.active||!!d.fault||d.kill||d.daily_locked||!!d.pending_status;
}
async function practiceRefresh(action){if(practiceBusy)return;practiceBusy=true;document.getElementById('practice-message').textContent='Consultando OANDA Demo…';
 try{practiceData=await practiceApi(action?{action}:undefined);practiceDraw(practiceData);document.getElementById('practice-message').textContent=action?'Estado demo guardado y confirmado.':'';}
 catch(e){document.getElementById('practice-message').textContent='Estado sin confirmar. '+e.message;document.getElementById('practice-start').disabled=true;}
 finally{practiceBusy=false;}
}
document.getElementById('practice-refresh').onclick=()=>practiceRefresh();
document.getElementById('practice-check').onclick=()=>practiceRefresh('check');
document.getElementById('practice-start').onclick=()=>practiceRefresh('start');
document.getElementById('practice-pause').onclick=()=>practiceRefresh('pause');
document.getElementById('practice-resume').onclick=()=>practiceRefresh('resume');
document.getElementById('practice-kill').onclick=()=>practiceRefresh('kill');
document.getElementById('practice-export').onclick=()=>{
 if(!practiceData)return;const text=JSON.stringify({exported_at_utc:new Date().toISOString(),...practiceData},null,2),u=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='forex-oanda-demo-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
};
go('practice');practiceRefresh();setInterval(()=>{if(!document.hidden)practiceRefresh();},30000);
