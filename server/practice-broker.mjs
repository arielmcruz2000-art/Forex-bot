// Only OANDA's practice host is reachable through this client. Never accepts URLs.
const BASE='https://api-fxpractice.oanda.com/v3';
export class BrokerError extends Error { constructor(code,uncertain=false){super(code);this.code=code;this.uncertain=uncertain;} }
export function practiceBroker(env=process.env,fetcher=fetch) {
  const account=env.OANDA_PRACTICE_ACCOUNT_ID,token=env.OANDA_PRACTICE_TOKEN;
  if(env.OANDA_PRACTICE_READ_ENABLED!=='true'||!token||!/^101-\d+-\d+-\d+$/.test(account||''))throw new BrokerError('practice-config-required');
  const prefix='/accounts/'+encodeURIComponent(account);
  const request=async(method,path,body)=>{
    try {
      const r=await fetcher(BASE+path,{method,redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(3000)});
      if(!r.ok)throw new BrokerError(r.status===404?'not-found':'broker-request-failed',method!=='GET'&&r.status>=500);
      return await r.json();
    } catch(e){if(e instanceof BrokerError)throw e;throw new BrokerError('broker-response-unknown',method!=='GET');}
  };
  const numericId=id=>{if(!/^\d+$/.test(String(id)))throw new BrokerError('invalid-trade-id');return String(id);};
  const clientId=id=>{if(!/^fb05-[a-f0-9]{32}$/.test(id))throw new BrokerError('invalid-client-id');return id;};
  return {
    async account(){const r=await request('GET',prefix+'/summary');if(r.account?.id!==account||r.account.currency!=='USD'||r.account.mt4AccountID)throw new BrokerError('unsupported-account');return r.account;},
    async candles(){const r=await request('GET','/instruments/EUR_USD/candles?count=100&granularity=M15&price=M');if(r.instrument!=='EUR_USD'||r.granularity!=='M15'||!Array.isArray(r.candles))throw new BrokerError('invalid-market-data');return r.candles.filter(c=>c.complete===true).map(c=>({time:c.time,close:Number(c.mid?.c),complete:true}));},
    async price(){const r=await request('GET',prefix+'/pricing?instruments=EUR_USD&includeUnitsAvailable=true');const p=r.prices?.find(p=>p.instrument==='EUR_USD');if(!p)throw new BrokerError('price-unavailable');return p;},
    async instrument(){const r=await request('GET',prefix+'/instruments?instruments=EUR_USD');const i=r.instruments?.find(i=>i.name==='EUR_USD');if(!i)throw new BrokerError('instrument-unavailable');return i;},
    async transactions(id){const r=await request('GET',prefix+'/transactions/sinceid?id='+numericId(id));if(!Array.isArray(r.transactions)||!/^\d+$/.test(r.lastTransactionID||''))throw new BrokerError('transactions-unavailable');return r;},
    async trade(id){const r=await request('GET',prefix+'/trades/'+numericId(id));if(String(r.trade?.id)!==String(id)||r.trade.instrument!=='EUR_USD')throw new BrokerError('trade-unavailable');return r.trade;},
    async order(id){const r=await request('GET',prefix+'/orders/@'+clientId(id));if(r.order?.clientExtensions?.id!==id)throw new BrokerError('order-unavailable');return r.order;},
    async submit(order){
      if(order?.type!=='MARKET'||order.instrument!=='EUR_USD'||order.timeInForce!=='FOK'||order.positionFill!=='OPEN_ONLY'||!/^-[1-9]\d*$/.test(order.units)||Number(order.units)<-100000||order.stopLossOnFill?.distance!=='0.00200'||order.stopLossOnFill?.timeInForce!=='GTC'||order.takeProfitOnFill?.timeInForce!=='GTC'||!/^\d+\.\d{5}$/.test(order.priceBound||'')||!/^\d+\.\d{5}$/.test(order.takeProfitOnFill?.price||'')||order.tradeClientExtensions?.id!==order.clientExtensions?.id)throw new BrokerError('unsafe-order');
      clientId(order.clientExtensions.id);return request('POST',prefix+'/orders',{order});
    },
    async protect(id,fill){if(!Number.isFinite(fill)||fill<=0.006)throw new BrokerError('invalid-fill');return request('PUT',prefix+'/trades/'+numericId(id)+'/orders',{stopLoss:{price:(fill+0.002).toFixed(5),timeInForce:'GTC'},takeProfit:{price:(fill-0.006).toFixed(5),timeInForce:'GTC'}});},
    async close(id){return request('PUT',prefix+'/trades/'+numericId(id)+'/close',{units:'ALL'});}
  };
}
