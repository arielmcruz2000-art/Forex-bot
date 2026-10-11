'use strict';
document.getElementById('refresh-oanda').onclick=async()=>{
  const button=document.getElementById('refresh-oanda'),status=document.getElementById('oanda-read-status'),summary=document.getElementById('oanda-read-summary');
  button.disabled=true;summary.replaceChildren();status.textContent='Comprobando lectura de la demo…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch('/api/oanda-practice',{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('No se obtuvo una respuesta de la demo. Comprueba la sesión y el despliegue.');
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'La lectura de la demo no está disponible.');
    if(data.mode!=='oanda-practice-read-only'||data.environment!=='practice'||data.execution_enabled!==false||data.order_routing_enabled!==false)throw Error('Respuesta de demo inesperada.');
    status.textContent='OANDA Practice: consulta de solo lectura conectada. Consulta el motor y las órdenes en OANDA Demo.';
    for(const [label,value] of [['Saldo demo USD',data.balance],['Equity demo USD',data.equity],['P/L realizado de la cuenta USD',data.realized_pnl],['P/L abierto de la cuenta USD',data.unrealized_pnl],['Operaciones abiertas',data.open_trade_count],['Órdenes pendientes',data.pending_order_count],['Última vela M15 completa (UTC)',data.last_complete_candle_at],['Velas completas recibidas',data.candles.length],['Consulta realizada (UTC)',data.observed_at_utc]]){
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);summary.append(dt,dd);
    }
    const note=document.createElement('p');note.textContent='El P/L pertenece a toda la cuenta. El informe separado de OANDA Demo identifica las operaciones del bot. Las velas mid y los resultados artificiales se mantienen separados. Con mercado cerrado, la última vela puede ser antigua.';summary.append(note);
  }catch(error){status.textContent='Lectura sin confirmar. '+(error.name==='AbortError'?'La consulta tardó demasiado.':error.message);}
  finally{clearTimeout(timer);button.disabled=false;}
};
