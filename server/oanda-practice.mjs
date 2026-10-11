// Read-only adapter: fixed practice origin, GET only, no broker-order methods.
const BASE='https://api-fxpractice.oanda.com/v3';
export async function practiceSnapshot(env=process.env,fetcher=fetch) {
  if(env.OANDA_PRACTICE_READ_ENABLED!=='true')return {status:409,error:'La lectura de OANDA Practice está desactivada.'};
  const token=env.OANDA_PRACTICE_TOKEN,account=env.OANDA_PRACTICE_ACCOUNT_ID;
  if(!token||!/^101-\d+-\d+-\d+$/.test(account||''))return {status:409,error:'Configura el token y la cuenta Practice en las variables privadas del servidor.'};
  try {
    const get=async path=>{
      const r=await fetcher(BASE+path,{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(8000)});
      if(!r.ok)throw Error('upstream');
      return r.json();
    };
    const [summary,series]=await Promise.all([get('/accounts/'+encodeURIComponent(account)+'/summary'),get('/instruments/EUR_USD/candles?count=100&granularity=M15&price=M')]);
    const a=summary.account;
    if(a?.id!==account||a.currency!=='USD'||series.instrument!=='EUR_USD'||series.granularity!=='M15'||!Array.isArray(series.candles))throw Error('shape');
    const number=value=>{if(value===null||value===undefined||value==='')throw Error('number');const n=Number(value);if(!Number.isFinite(n))throw Error('number');return n;};
    const candles=series.candles.filter(c=>c.complete===true).map(c=>{
      if(!Number.isFinite(Date.parse(c.time)))throw Error('time');
      const o=number(c.mid?.o),h=number(c.mid?.h),l=number(c.mid?.l),close=number(c.mid?.c);
      if(l<=0||h<Math.max(o,close,l)||l>Math.min(o,close))throw Error('ohlc');
      return {time:c.time,open:o,high:h,low:l,close,complete:true};
    });
    if(!candles.length||candles.some((c,i)=>i&&Date.parse(c.time)<=Date.parse(candles[i-1].time)))throw Error('series');
    return {status:200,data:{mode:'oanda-practice-read-only',data_source:'market-data',environment:'practice',read_connected:true,execution_enabled:false,order_routing_enabled:false,instrument:'EUR_USD',granularity:'M15',currency:'USD',balance:number(a.balance),equity:number(a.NAV),realized_pnl:number(a.pl),unrealized_pnl:number(a.unrealizedPL),open_trade_count:number(a.openTradeCount),open_position_count:number(a.openPositionCount),pending_order_count:number(a.pendingOrderCount),observed_at_utc:new Date().toISOString(),last_complete_candle_at: candles.at(-1).time,candles,notes:'Lectura de cuenta demo y velas mid. No calcula rentabilidad atribuible al bot ni envía órdenes. Comprobar antigüedad de las velas y spread antes de investigar ejecución.'}};
  }catch{return {status:502,error:'No se pudo verificar la cuenta Practice o sus velas. Revisa acceso y configuración; no se enviaron órdenes.'};}
}
