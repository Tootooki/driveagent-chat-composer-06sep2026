// Recording is sent only by Stop in microphone mode. Live mode ends each turn
// after speech followed by silence. All media stays off until a user gesture.
export function createVoiceSession({host=globalThis,getPreferences=()=>({}),client,onChange=()=>{},onLevel=()=>{},onTranscript=async()=>''}={}){
 let mode='off',phase='idle',generation=0,controller=null,stream=null,recorder=null,context=null,analyser=null,source=null,playback=null,finishPlayback=null,readyBlob=null,sendOnStop=false;
 const timers=new Set(),clock=()=>host.performance?.now?.()??Date.now();
 const changed=(next,message='')=>{phase=next;onChange({mode,phase,message});};
 const later=(fn,ms)=>{const id=host.setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
 const clearTimers=()=>{for(const id of timers)host.clearTimeout(id);timers.clear();};
 const alive=id=>id===generation&&mode!=='off';
 function stop(message=''){
  generation++;mode='off';controller?.abort();controller=null;clearTimers();
  if(recorder){recorder.onstop=null;recorder.ondataavailable=null;recorder.onerror=null;if(recorder.state!=='inactive')try{recorder.stop();}catch{}recorder=null;}
  for(const track of stream?.getTracks()||[])track.stop();stream=null;source?.disconnect();source=null;analyser=null;
  if(playback){playback.onended=null;try{playback.stop();}catch{}playback.disconnect();playback=null;}
  finishPlayback?.(false);finishPlayback=null;readyBlob=null;sendOnStop=false;onLevel(0);changed('idle',message);
 }
 const fail=(error,id)=>{if(alive(id))stop(error?.name==='NotAllowedError'?'Microphone access was denied. Allow it in your browser settings.':error?.name==='NotFoundError'?'No microphone is available.':error?.message||'Voice could not start. Please try again.');};
 function audioContext(){const Ctx=host.AudioContext||host.webkitAudioContext;if(!Ctx)throw Error('Audio playback is unavailable in this browser.');context??=new Ctx();context.resume()?.catch(()=>{if(mode!=='off')stop('Audio playback was blocked. Tap the sound button to try again.');});return context;}
 async function speak(text,id){
  onLevel(0);changed('preparing','Preparing voice');const buffer=await client.speech(text,{signal:controller.signal,voice:getPreferences().voice||'luna'});if(!alive(id))return false;
  const ctx=audioContext(),decoded=await ctx.decodeAudioData(buffer.slice(0));if(!alive(id))return false;
  return new Promise((resolve,reject)=>{const node=ctx.createBufferSource(),meter=ctx.createAnalyser();meter.fftSize=1024;const samples=new Float32Array(meter.fftSize);node.buffer=decoded;node.playbackRate.value=getPreferences().rate||1;node.connect(meter);meter.connect(ctx.destination);playback=node;finishPlayback=()=>{meter.disconnect();resolve(false);};node.onended=()=>{if(playback===node)playback=null;finishPlayback=null;node.disconnect();meter.disconnect();onLevel(0);resolve(true);};try{node.start();changed('speaking','Speaking');
   const measure=()=>{if(!alive(id)||playback!==node)return;meter.getFloatTimeDomainData(samples);onLevel(level(samples));later(measure,50);};measure();
   later(()=>{if(alive(id)&&playback===node){stop('Playback stopped. Try reading the message again.');}},Math.max(15000,decoded.duration*1500+5000));}catch(error){meter.disconnect();reject(error);}});
 }
 async function process(blob,id){
  if(!alive(id))return;readyBlob=null;clearTimers();onLevel(0);changed('transcribing','Transcribing');
  try{
   const text=await client.transcribe(blob,{signal:controller.signal});if(!alive(id))return;
   const dictation=mode==='dictation';if(!dictation)changed('thinking','Responding');const reply=await onTranscript(text,{signal:controller.signal,mode});if(!alive(id))return;
   if(!dictation&&reply&&getPreferences().readReplies!==false)await speak(reply,id);if(!alive(id))return;
   if(mode==='live'){changed('waiting','Live voice');later(()=>startRecorder(id),350);}else stop();
  }catch(error){fail(error,id);}
 }
 function startRecorder(id){
  if(!alive(id))return;clearTimers();let chunks=[],heard=false,loudSince=0,lastSound=0;const began=clock();sendOnStop=false;readyBlob=null;
  try{
   const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>host.MediaRecorder.isTypeSupported?.(t));
   const current=new host.MediaRecorder(stream,type?{mimeType:type}:undefined);recorder=current;
   current.ondataavailable=event=>{if(alive(id)&&event.data?.size)chunks.push(event.data);};
   current.onerror=()=>fail(Error('Recording failed. Please try again.'),id);
   current.onstop=()=>{if(!alive(id)||recorder!==current)return;const blob=new host.Blob(chunks,{type:current.mimeType||type||'audio/webm'});recorder=null;onLevel(0);
    if(mode==='live'){if(heard&&blob.size)process(blob,id);else later(()=>startRecorder(id),200);}
    else{for(const track of stream?.getTracks()||[])track.stop();stream=null;source?.disconnect();source=null;analyser=null;if(sendOnStop)process(blob,id);else{readyBlob=blob;changed('ready',mode==='dictation'?'Recording ready — press Stop to transcribe':'Recording ready — press Stop to send');}}
   };
   current.start(150);changed('listening',mode==='dictation'?'Recording — press Stop to transcribe':mode==='mic'?'Recording — press Stop to send':'Listening');
   {
    const samples=new Float32Array(analyser.fftSize);
    const monitor=()=>{if(!alive(id)||recorder!==current||current.state!=='recording')return;analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length),now=clock();
     onLevel(Math.min(1,rms*9));
     if(rms>.018){lastSound=now;loudSince||=now;if(now-loudSince>=150)heard=true;}else loudSince=0;
     if(mode==='live'&&(heard&&now-lastSound>=650||now-began>=30000)){current.stop();return;}later(monitor,50);
    };later(monitor,50);
   }if(mode!=='live')later(()=>{if(alive(id)&&recorder===current&&current.state==='recording')current.stop();},60000);
  }catch(error){fail(error,id);}
 }
 async function start(nextMode){
  stop();mode=nextMode;const id=generation;controller=new host.AbortController();changed('starting','Opening microphone');
  try{
   if(!host.navigator?.mediaDevices?.getUserMedia||!host.MediaRecorder)throw Error('Microphone recording is unavailable here. Open this page in your browser.');
   const ctx=audioContext();const opened=await host.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(!alive(id)){opened.getTracks().forEach(t=>t.stop());return;}stream=opened;analyser=ctx.createAnalyser();analyser.fftSize=1024;source=ctx.createMediaStreamSource(stream);source.connect(analyser);startRecorder(id);
  }catch(error){fail(error,id);}
 }
 function toggleRecording(nextMode){
  if(mode===nextMode){
   if(readyBlob)return process(readyBlob,generation);
   if(recorder?.state==='recording'){sendOnStop=true;clearTimers();changed('finishing',mode==='dictation'?'Finishing dictation':'Sending recording');recorder.stop();}else stop();
  }else start(nextMode);
 }
 function toggleLive(){if(mode==='live')stop();else start('live');}
 async function preview(text){stop();if(!text)return;mode='preview';const id=generation;controller=new host.AbortController();try{audioContext();await speak(text,id);if(alive(id))stop();}catch(error){fail(error,id);}}
 return{stop,toggleMic:()=>toggleRecording('mic'),toggleDictation:()=>toggleRecording('dictation'),toggleLive,preview,getState:()=>({mode,phase})};
}
const level=samples=>Math.min(1,9*Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length));
