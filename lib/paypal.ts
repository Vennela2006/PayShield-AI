const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
let cached:{token:string;expires:number}|null=null;
export function paypalConfigured(){return Boolean(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET)}
async function accessToken(){
  if(!paypalConfigured()) throw new Error('PayPal credentials are not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local.');
  if(cached&&cached.expires>Date.now()+60000) return cached.token;
  const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r=await fetch(`${base}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',cache:'no-store'});
  const data=await r.json(); if(!r.ok) throw new Error(data.error_description||'PayPal OAuth failed');
  cached={token:data.access_token,expires:Date.now()+Number(data.expires_in)*1000}; return cached.token;
}
export async function paypalRequest(path:string,method:string,body?:unknown,requestId?:string){
  const token=await accessToken(); const r=await fetch(`${base}${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await r.json(); if(!r.ok) throw new Error(data.message||data.name||`PayPal request failed (${r.status})`); return data;
}
