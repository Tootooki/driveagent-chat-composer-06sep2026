export const CHAT_API='https://driveagent-chat-api-06sep2026.luma-voice-svlad92.workers.dev';
export function createChatClient({host=globalThis,base=CHAT_API}={}){
 async function request(path,options,signal){
  const controller=new host.AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();signal?.addEventListener('abort',abort,{once:true});
  const timer=host.setTimeout(abort,45000);
  try{const response=await host.fetch(base+path,{...options,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok){let error;try{error=await response.json();}catch{}throw Error(error?.error||'The AI service could not be reached. Please try again.');}return await options.consume(response,controller.signal);}
  catch(error){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');if(controller.signal.aborted)throw Error('The response took too long. Please try again.');if(error instanceof TypeError)throw Error('Connection lost. Your message is saved. Please try again.');throw error;}
  finally{host.clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
 return{
  async chat({messages,room,voice=false,signal,onDelta=()=>{}}){return request('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,room,voice}),consume:async response=>{
   if(!response.headers.get('content-type')?.includes('text/event-stream'))throw Error('The AI returned an unreadable response.');
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',reply='',complete=false;
   function line(value){if(!value.startsWith('data:'))return;const data=value.slice(5).trim();if(!data)return;if(data==='[DONE]'){complete=true;return;}let event;try{event=JSON.parse(data);}catch{throw Error('The AI response was interrupted. Please try again.');}if(event.error)throw Error('The AI response was interrupted. Please try again.');const chunk=event.response??event.choices?.[0]?.delta?.content;if(typeof chunk==='string'){reply+=chunk;onDelta(reply);}}
   try{while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const entry of lines)line(entry);if(reply.length>10000)throw Error('The response was too long.');}buffer+=decoder.decode();if(buffer.trim())line(buffer.trim());if(!reply.trim()||!complete)throw Error('The AI response was interrupted. Please try again.');return reply.trim();}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  }},signal);},
  transcribe(blob,{signal}={}){const form=new host.FormData();form.append('audio',blob,'message.'+(blob.type.includes('mp4')?'m4a':'webm'));return request('/transcribe',{method:'POST',body:form,consume:r=>r.json()},signal).then(r=>r.text);},
  speech(text,{signal,voice='luna'}={}){return request('/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice}),consume:r=>r.arrayBuffer()},signal);}
 };
}
