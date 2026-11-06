import {NextResponse} from 'next/server';
export const runtime='nodejs';
const MAX=8*1024*1024;
function fieldsFromText(text:string,sourceFile:string){
 const amount=text.match(/(?:USD\s*|\$\s*|amount\s*[:=]?\s*)(\d+(?:\.\d{1,2})?)/i)?.[1]||null;
 const transactionId=text.match(/(?:transaction|reference|txn|order)(?:\s*(?:id|no|number))?\s*[:#= -]+([A-Z0-9-]{5,})/i)?.[1]||null;
 const date=text.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/)?.[0]||null;
 const recipient=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||null;
 return {amount:amount?Number(amount):null,transactionId,date,recipient,sourceFile};
}
export async function POST(req:Request){try{
 const form=await req.formData();const file=form.get('file');
 if(!(file instanceof File))return NextResponse.json({error:'Upload a file.'},{status:400});
 if(file.size===0)return NextResponse.json({error:'The uploaded file is empty.'},{status:400});
 if(file.size>MAX)return NextResponse.json({error:'File must be smaller than 8 MB.'},{status:413});
 const ext=file.name.split('.').pop()?.toLowerCase()||'';
 if(ext==='txt'){const text=await file.text();return NextResponse.json({mode:'TEXT_RULES',message:'Text parsed. Verify all candidate fields manually.',text,fields:fieldsFromText(text,file.name)});}
 const service=(process.env.OCR_SERVICE_URL||'').replace(/\/$/,'');
 if(!service)return NextResponse.json({mode:'OCR_NOT_CONFIGURED',message:'PaddleOCR service is not connected. Start the OCR service and set OCR_SERVICE_URL in .env.local.',fields:fieldsFromText('',file.name)}, {status:503});
 const forward=new FormData();forward.append('file',file,file.name);
 const response=await fetch(`${service}/extract`,{method:'POST',body:forward,cache:'no-store',signal:AbortSignal.timeout(90000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)return NextResponse.json({error:result.detail||'OCR service failed.'},{status:response.status});
 const text=String(result.text||'');
 return NextResponse.json({mode:'PADDLEOCR',message:'OCR completed. Extracted values are unverified candidates.',text,lines:result.lines||[],fields:fieldsFromText(text,file.name),warning:result.warning||'Verify every field against the original evidence.'});
 }catch(e){const message=e instanceof Error?e.message:'Evidence extraction failed.';return NextResponse.json({error:message.includes('timeout')?'OCR service timed out. Try a smaller image.':message},{status:502});}}
