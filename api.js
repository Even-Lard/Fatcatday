// Cloudflare Pages Function: GET /api?action=options|dashboard|calendar|queue&name=...
// 此 API 僅代理唯讀 Google Apps Script；不接受寫入或提交請假。
const GOOGLE_API = 'https://script.google.com/macros/s/AKfycbxilmJYAg0R5f6OaSHGpuIHSlxZq4V6LoxjD8e85JI6j8I6ByhFWP_ulZevi4tjZsWXWw/exec';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
export async function onRequestGet({request}){
  const url=new URL(request.url);
  const action=url.searchParams.get('action')||'options';
  const name=(url.searchParams.get('name')||'').trim();
  if(!['options','calendar','queue','dashboard'].includes(action)) return reply({success:false,error:'不支援的查詢'},400);
  if(action!=='options'&&(!name||name.length>50))return reply({success:false,error:'請提供正式姓名'},400);
  const upstream=new URL(GOOGLE_API);upstream.searchParams.set('action',action);
  if(action!=='options')upstream.searchParams.set('name',name);
  try{
    const response=await fetch(upstream.toString(),{redirect:'follow',headers:{Accept:'application/json'},cf:{cacheTtl:0}});
    if(!response.ok)return reply({success:false,error:'Google 資料服務暫時無法連線（'+response.status+'）'},502);
    const payload=await response.text();
    if(payload.length>300000)return reply({success:false,error:'班表回應資料過大'},502);
    let data;try{data=JSON.parse(payload)}catch{return reply({success:false,error:'Google API 回傳非 JSON，請檢查部署權限'},502)}
    if(!data||typeof data!=='object'||typeof data.success!=='boolean')return reply({success:false,error:'Google API 回傳格式異常'},502);
    return reply(data);
  }catch(error){return reply({success:false,error:'無法連線 Google 試算表服務，請稍後重試'},502)}
}
