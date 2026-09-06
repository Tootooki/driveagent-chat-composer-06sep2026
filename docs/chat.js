import {chatViewportInsets} from './chat-viewport.mjs?v=74';
import {CHAT_STORAGE_KEY,LEGACY_CHAT_STORAGE_KEY,CHAT_GREETING,createChatState,activeChat,ensureProductChat,appendChatMessage,sortedChats,latestChat,savedChats,ensureStrategyChats,greetChat,chatSuggestions} from './chat-model.mjs?v=133';
import {attachColumnResizer,chatColumnWidth,chatColumnLimits} from './column-resizer.mjs?v=120';
import {createVoiceSession} from './audio-session.mjs?v=133';
import {createChatClient} from './chat-client.mjs?v=130';

const byId=id=>document.getElementById(id);
const widget=byId('chat-widget'),panel=byId('chat-popup'),launcher=byId('chat-launcher'),menu=byId('menu-backdrop'),shell=document.querySelector('.workbook-shell');
const messages=byId('chat-messages'),rooms=byId('chat-rooms'),conversation=byId('chat-conversation'),settings=byId('chat-settings'),status=byId('chat-status');
let restored,preferences={readReplies:true,voice:'luna',rate:1};
const client=createChatClient({host:window});let activeRequest=null;const messageNodes=new Map();
const suggestions=byId('chat-suggestions'),welcomeArt=byId('chat-welcome-art');
try{restored=JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)||localStorage.getItem(LEGACY_CHAT_STORAGE_KEY));}catch{}
try{const saved=JSON.parse(localStorage.getItem('driveagent:voice-settings:v1'));if(saved)preferences={readReplies:saved.readReplies!==false,voice:typeof saved.voice==='string'?saved.voice:'',rate:[.85,1,1.2].includes(saved.rate)?saved.rate:1};}catch{}
const state=ensureStrategyChats(createChatState(restored));const pendingReplies=new Set();
const input=byId('chat-input'),form=byId('chat-form'),submit=byId('chat-submit');let opener=launcher,pageMode=false,view='messages',dictationTarget=null;
const addButton=byId('chat-add'),addMenu=byId('chat-add-menu'),dictateButton=byId('chat-dictate');
const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const room=()=>activeChat(state);
const setStatus=text=>{status.textContent=text;status.hidden=!text;};
const persist=()=>{try{localStorage.setItem(CHAT_STORAGE_KEY,JSON.stringify(savedChats(state)));}catch{setStatus('Saved for this visit only.');}};
const savePreferences=()=>{try{localStorage.setItem('driveagent:voice-settings:v1',JSON.stringify(preferences));}catch{}};
const scrollEnd=()=>{messages.scrollTop=messages.scrollHeight;};
const voice=createVoiceSession({host:window,client,getPreferences:()=>preferences,onChange:({mode,phase,message})=>{
  widget.dataset.voiceMode=mode;widget.dataset.voicePhase=phase;setStatus(message);
  byId('chat-live').setAttribute('aria-pressed',String(mode==='live'));byId('chat-live').setAttribute('aria-label',mode==='live'?'Stop live voice':'Start live voice');
  byId('chat-mic').setAttribute('aria-pressed',String(['mic','dictation'].includes(mode)));byId('chat-mic').setAttribute('aria-label',mode==='dictation'?'Stop and transcribe recording':mode==='mic'?'Stop and send recording':'Record a voice message');
  refreshComposer();syncLauncher();
},onLevel:level=>{launcher.style.setProperty('--voice-level',level.toFixed(3));submit.style.setProperty('--voice-level',level.toFixed(3));},onTranscript:(text,options)=>options.mode==='dictation'?insertDictation(text,options):sendTurn(text,{spoken:true,signal:options.signal})});

function renderRooms(){
  const top=rooms.scrollTop;rooms.replaceChildren();
  for(const item of sortedChats(state,{recentFirst:pageMode})){
    const button=element('button','room-button');button.type='button';button.dataset.chatId=item.id;button.setAttribute('aria-label',item.title+(item.unread?` · ${item.unread} unread`:''));
    if(item.id===state.active)button.setAttribute('aria-current','page');
    const avatar=element('span','room-avatar',item.emoji||(item.sku?item.title.slice(0,2).toUpperCase():'•••'));
    if(item.emoji){avatar.classList.add('room-emoji');avatar.setAttribute('aria-hidden','true');}
    if(item.image){const image=element('img');image.src=item.image;image.alt='';image.loading='lazy';avatar.replaceChildren(image);}button.append(avatar);
    const copy=element('span','room-copy');copy.append(element('strong','',item.title),element('span','room-preview',item.messages.at(-1)?.text||'Start a conversation'));button.append(copy);
    if(item.unread)button.append(element('span','room-unread',String(item.unread)));
    button.addEventListener('click',()=>selectRoom(item.id));rooms.append(button);
  }
  rooms.scrollTop=top;
}
function isRailOpen(){return pageMode&&byId('ppc-control-panel')?.hidden===false;}
function syncRail(){
 const open=isRailOpen();widget.dataset.railOpen=String(open);rooms.hidden=pageMode?!open:view!=='rooms';byId('chat-column-resizer').hidden=!open;
 if(!open&&rooms.contains(document.activeElement))byId('header-menu').focus({preventScroll:true});
}
function setView(next='messages'){
 closeAddMenu();
  view=pageMode&&next==='rooms'?'messages':next;
  rooms.hidden=pageMode?!isRailOpen():view!=='rooms';conversation.hidden=view==='rooms';settings.hidden=view!=='settings';messages.hidden=view!=='messages';
  byId('chat-settings-toggle').setAttribute('aria-expanded',String(view!=='messages'));
  panel.dataset.rooms=view==='rooms'?'open':'closed';panel.dataset.view=view;form.hidden=!pageMode||view!=='messages';renderSuggestions();
}
function renderSuggestions(){
  const welcome=pageMode&&view==='messages'&&!room().messages.some(m=>m.role==='user');widget.dataset.welcome=String(welcome);suggestions.hidden=!welcome;welcomeArt.hidden=!welcome||document.documentElement.dataset.chatDesign!=='studio';
  if(!welcome)return;suggestions.replaceChildren();
  for(const suggestion of chatSuggestions(room())){const button=element('button','chat-suggestion');button.type='button';const img=element('img');img.src='chat-art/'+suggestion.art+'.svg';img.alt='';img.width=48;img.height=48;button.append(img,element('span','',suggestion.label),element('span','suggestion-arrow','↗'));button.addEventListener('click',()=>sendTurn(suggestion.prompt));suggestions.append(button);}
}
function renderMessages(){
  if(panel.dataset.chatId!==state.active){messages.replaceChildren();messageNodes.clear();}
  messages.setAttribute('aria-busy',String(Boolean(activeRequest?.id===state.active)));messages.setAttribute('aria-label',room().title+' messages');panel.dataset.chatId=state.active;
  for(const [item,node] of messageNodes){if(!room().messages.includes(item)){node.remove();messageNodes.delete(item);}}
  for(const [index,item] of room().messages.entries()){
    let article=messageNodes.get(item);
    if(!article){article=element('article','chat-message'+(item.role==='user'?' from-user':''));article.setAttribute('aria-label',item.role==='user'?'You':'Assistant');article.append(element('p',''));
      const actions=element('div','message-actions');
      const copy=messageButton('Copy message '+(index+1),'copy',event=>copyMessage(item.text,event.currentTarget));
      const read=messageButton('Read message '+(index+1),'read',()=>voice.preview(item.text));
      actions.append(copy,read);article.append(actions);messages.append(article);messageNodes.set(item,article);
    }
    article.querySelector('p').textContent=item.text||'…';article.dataset.pending=String(Boolean(item.pending));article.dataset.error=String(item.status==='error');
    for(const button of article.querySelectorAll('.message-button'))button.disabled=Boolean(item.pending)||!item.text;
    if(item.status==='error'&&!article.querySelector('.message-retry')){const retry=element('button','message-retry','Try again');retry.type='button';retry.addEventListener('click',()=>{room().messages.splice(room().messages.indexOf(item),1);sendTurn(null,{retry:true});});article.append(retry);}
  }
  renderSuggestions();
}

function messageButton(label,kind,handler){
  const button=element('button','message-button');button.type='button';button.setAttribute('aria-label',label);button.dataset.messageAction=kind;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',kind==='copy'?'M9 8h11v13H9zM5 16H3V3h11v2':'M4 9h4l5-4v14l-5-4H4zM16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12');svg.append(path);button.append(svg);
  button.addEventListener('pointerdown',event=>{if(event.button===0)event.preventDefault();});button.addEventListener('click',handler);return button;
}
async function copyMessage(text,button){
 try{if(!navigator.clipboard?.writeText)throw Error('unavailable');await navigator.clipboard.writeText(text);setStatus('COPIED');button.dataset.copied='true';const label=button.getAttribute('aria-label');button.setAttribute('aria-label','Copied');const timer=setTimeout(()=>{pendingReplies.delete(timer);if(button.isConnected){delete button.dataset.copied;button.setAttribute('aria-label',label);}},1800);pendingReplies.add(timer);}
 catch{setStatus('Copy is unavailable here. Select the message text to copy it.');}
}
function cancelRequest(){activeRequest?.controller.abort();}
async function sendTurn(text,{spoken=false,signal,retry=false}={}){
 if(activeRequest)return '';if(!retry&&String(text||'').length>2000){setStatus('Keep each message under 2,000 characters. Your draft is still here.');return '';}if(!spoken)voice.stop();const target=room(),id=target.id;
 if(!retry){if(!text?.trim())return '';appendChatMessage(state,id,'user',text);if(!spoken){input.value='';target.draft='';}}
 const history=target.messages.filter(m=>!m.status&&!m.pending&&m.text).slice(-12).map(m=>({role:m.role,content:m.text}));
 const answer={role:'assistant',text:'',time:Date.now(),pending:true};target.messages.push(answer);
 const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();signal?.addEventListener('abort',abort,{once:true});activeRequest={controller,id,spoken};
 refreshComposer();renderMessages();renderRooms();persist();scrollEnd();
 try{
  const reply=await client.chat({messages:history,room:{id:target.id,sku:target.sku},voice:spoken,signal:controller.signal,onDelta:value=>{if(controller.signal.aborted)return;const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<100;answer.text=value;if(state.active===id){renderMessages();if(nearBottom)scrollEnd();}}});
  answer.text=reply;delete answer.pending;target.updatedAt=Date.now();return reply;
 }catch(error){
  delete answer.pending;
  if(controller.signal.aborted){if(!answer.text)target.messages.splice(target.messages.indexOf(answer),1);else answer.status='stopped';if(state.active===id)setStatus('Response stopped');}
  else{answer.status='error';answer.text=error.message||'The AI service could not be reached. Please try again.';}
  if(spoken)throw error;return '';
 }finally{
  signal?.removeEventListener('abort',abort);if(activeRequest?.controller===controller)activeRequest=null;
  refreshComposer();if(state.active===id)renderMessages();renderRooms();persist();
 }
}

function refreshComposer(){
 const busy=Boolean(activeRequest?.id===state.active),text=Boolean(input.value.trim()),mode=widget.dataset.voiceMode||'off',phase=widget.dataset.voicePhase||'idle',dictating=mode==='dictation',live=mode==='live';
 submit.disabled=dictating;submit.dataset.action=busy?'stop':text?'send':'live';submit.dataset.busy=String(busy);submit.setAttribute('aria-label',busy?'Stop response':text?'Send message':live?'Stop live voice':'Start live voice');
 if(!busy&&!text)submit.setAttribute('aria-pressed',String(live));else submit.removeAttribute('aria-pressed');
 submit.querySelector('path').setAttribute('d',busy?'M6 6h12v12H6z':'M12 20V4m-7 7 7-7 7 7');
 dictateButton.setAttribute('aria-pressed',String(dictating));dictateButton.setAttribute('aria-label',dictating?'Stop dictation':'Dictate message');dictateButton.disabled=busy||dictating&&['transcribing','finishing'].includes(phase);
 input.style.height='44px';input.style.height=Math.min(84,Math.max(44,input.scrollHeight))+'px';
}
function insertDictation(text,{signal}={}){
 if(signal?.aborted||!dictationTarget||dictationTarget.id!==state.active)return '';
 const draft=input.value,unchanged=draft===dictationTarget.value,start=unchanged?dictationTarget.start:draft.length,end=unchanged?dictationTarget.end:draft.length;
 const before=draft.slice(0,start),after=draft.slice(end),spoken=String(text||'').trim();if(!spoken)return '';
 const value=(before&&!/\s$/.test(before)?' ':'')+spoken+(after&&!/^\s/.test(after)?' ':'');
 input.setRangeText(value,start,end,'end');room().draft=input.value;dictationTarget=null;refreshComposer();persist();return '';
}
function closeAddMenu(){addMenu.hidden=true;addButton.setAttribute('aria-expanded','false');}

function selectRoom(id){
  if(!state.rooms.some(item=>item.id===id))return;
  if(id!==state.active){cancelRequest();voice.stop();}room().draft=input.value;state.active=id;room().unread=0;input.value=room().draft;refreshComposer();greetChat(state,id);setView();renderRooms();renderMessages();persist();scrollEnd();
}
function updateViewport(){
  if(panel.hidden)return;
  const bounds=pageMode?widget.parentElement:shell;
  const editing=panel.contains(document.activeElement)&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  const fit=document.documentElement.hasAttribute('data-chrome-viewport')?{top:0,bottom:0,short:bounds.clientHeight<420,keyboard:document.documentElement.getAttribute('data-chrome-keyboard')==='true'}:chatViewportInsets({shell:bounds.getBoundingClientRect(),viewport:window.visualViewport,typing:editing,wasKeyboard:widget.dataset.keyboard==='true'});
  widget.style.setProperty('--chat-keyboard-inset',fit.bottom+'px');widget.style.setProperty('--chat-keyboard-top',fit.top+'px');widget.dataset.short=String(fit.short);widget.dataset.keyboard=String(fit.keyboard);
  const wasKeyboard=document.documentElement.hasAttribute('data-chat-keyboard');
  document.documentElement.toggleAttribute('data-chat-keyboard',pageMode&&fit.keyboard);
  if(wasKeyboard&&!document.documentElement.hasAttribute('data-chat-keyboard'))window.dispatchEvent(new Event('dolce:chat-keyboard-end'));
}
function syncLauncher(){
  const open=!panel.hidden&&!pageMode;launcher.hidden=pageMode||!menu.hidden;
  const mode=widget.dataset.voiceMode||'off',phase=widget.dataset.voicePhase||'idle';
  const activity=mode==='off'?'':mode==='dictation'?'dictation '+phase:mode==='mic'?(phase==='listening'?'recording continues':phase==='ready'?'recording ready to send':'voice message '+phase):mode==='live'?'live voice '+phase:'reading aloud';
  launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'Close chat':activity?'Open chat — '+activity:'Open main chat');
  launcher.title=open&&activity?'Close panel — voice stays on':activity||'Open main chat';
  launcher.dataset.voiceActive=String(mode!=='off');
}
function closeChat({restoreFocus=true}={}){
  if(pageMode)return;
  // Hiding the panel never ends recording, playback or a spoken reply.
  if(activeRequest&&!activeRequest.spoken)cancelRequest();
  const wasOpen=!panel.hidden;document.body.removeAttribute('data-chat-overlay');room().draft=input.value;persist();panel.hidden=true;widget.dataset.open='false';widget.dataset.keyboard='false';setView();syncLauncher();
  widget.style.setProperty('--chat-keyboard-inset','0px');widget.style.setProperty('--chat-keyboard-top','0px');
  if(panel.contains(document.activeElement))document.activeElement.blur();
  if(wasOpen&&restoreFocus)(opener?.isConnected&&!opener.closest('[hidden]')?opener:launcher).focus({preventScroll:true});
}
function openChat(id='main',source=launcher){
  if(!menu.hidden)return;document.body.setAttribute('data-chat-overlay','true');opener=source;panel.hidden=false;widget.dataset.open='true';selectRoom(id);syncLauncher();updateViewport();panel.focus({preventScroll:true});
}
launcher.addEventListener('click',()=>{if(panel.hidden)openChat(voice.getState().mode!=='off'||activeRequest?state.active:'main');else closeChat();});
byId('chat-settings-toggle').addEventListener('click',()=>{setView(view==='messages'?'settings':'messages');});
byId('chat-rooms-toggle').addEventListener('click',()=>setView('rooms'));
byId('chat-live').addEventListener('click',()=>{input.blur();setView();voice.toggleLive();});
byId('chat-mic').addEventListener('click',()=>{input.blur();setView();if(widget.dataset.voiceMode==='dictation')voice.toggleDictation();else voice.toggleMic();});
byId('chat-test-voice').addEventListener('click',()=>voice.preview(CHAT_GREETING));
byId('chat-read-last').addEventListener('click',()=>{const last=room().messages.findLast(item=>item.role==='assistant');if(last)voice.preview(last.text);});
byId('chat-read-replies').setAttribute('aria-pressed',String(preferences.readReplies));
byId('chat-read-replies').addEventListener('click',event=>{preferences.readReplies=!preferences.readReplies;event.currentTarget.setAttribute('aria-pressed',String(preferences.readReplies));savePreferences();});
byId('chat-speed').value=String(preferences.rate);byId('chat-speed').addEventListener('change',event=>{preferences.rate=Number(event.target.value);savePreferences();});
byId('chat-voice').value=['luna','orion','athena'].includes(preferences.voice)?preferences.voice:'luna';
byId('chat-voice').addEventListener('change',event=>{preferences.voice=event.target.value;savePreferences();});
document.addEventListener('dolce:product-chat',event=>{const target=ensureProductChat(state,event.detail);if(target)openChat(target.id,event.detail.opener);});
document.addEventListener('keydown',event=>{if(!pageMode&&!event.defaultPrevented&&event.key==='Escape'&&!panel.hidden){event.preventDefault();if(view!=='messages'){setView();byId('chat-settings-toggle').focus({preventScroll:true});}else closeChat();}});
function syncMenu(){syncRail();if(!menu.hidden){if(!pageMode)closeChat({restoreFocus:false});}syncLauncher();}
new MutationObserver(syncMenu).observe(menu,{attributes:true,attributeFilter:['hidden']});
byId('header-home').addEventListener('click',()=>{voice.stop();closeChat({restoreFocus:false});});
document.addEventListener('dolce:ppc-controls-change',event=>{syncRail();if(event.detail.open){if(!pageMode)closeChat({restoreFocus:false});}requestAnimationFrame(updateViewport);});
panel.addEventListener('focusin',updateViewport);panel.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
window.addEventListener('pageshow',updateViewport);window.addEventListener('resize',updateViewport,{passive:true});window.addEventListener('dolce:viewportchange',updateViewport);
window.visualViewport?.addEventListener('resize',updateViewport,{passive:true});window.visualViewport?.addEventListener('scroll',updateViewport,{passive:true});
window.addEventListener('pagehide',event=>{cancelRequest();voice.stop();room().draft=input.value;persist();if(!event.persisted)for(const timer of pendingReplies)clearTimeout(timer);});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelRequest();voice.stop();}});
function leaveChatPage(){
  if(!pageMode)return;room().draft=input.value;pageMode=false;document.documentElement.removeAttribute('data-chat-keyboard');byId('chat-column-resizer').hidden=true;delete widget.dataset.page;shell.append(widget);panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');setView();closeChat({restoreFocus:false});syncMenu();
}
function syncWorkspace(){
  if(document.body.dataset.activeWorkspace!=='chat'){leaveChatPage();return;}
  const host=byId('module-workspace');if(!host)return;document.body.removeAttribute('data-chat-overlay');const entering=!pageMode;pageMode=true;widget.dataset.page='true';if(widget.parentElement!==host)host.append(widget);
  panel.setAttribute('role','region');panel.removeAttribute('aria-modal');panel.hidden=false;widget.dataset.open='true';
  if(entering)selectRoom(voice.getState().mode!=='off'||activeRequest?state.active:latestChat(state).id);else setView();syncRail();syncMenu();refreshListWidth();updateViewport();
}
function refreshProductImages(view=window.dolceSheetView){
  let changed=false;for(const product of view?.rows||[]){if(product.isHeader||product.isTotal||!product.image)continue;const existing=state.rooms.find(item=>item.sku&&item.sku===product.sku);if(existing&&existing.image!==product.image){ensureProductChat(state,product);changed=true;}}
  if(changed){renderRooms();persist();}
}
window.addEventListener('dolce:workspace-changing',event=>{if(event.detail.active!=='chat')leaveChatPage();});
window.addEventListener('dolce:workspace-change',syncWorkspace);document.addEventListener('dolce:sheet-render',event=>refreshProductImages(event.detail));
let chatWidthRatio=null;try{const saved=Number(localStorage.getItem('driveagent:chat-list-width:v1'));if(saved>0&&saved<1)chatWidthRatio=saved;}catch{}
const listSize=()=>panel.clientWidth||window.innerWidth||390;
function refreshListWidth(){const width=chatColumnWidth(listSize(),chatWidthRatio);widget.style.setProperty('--chat-list-width',width+'px');widget.dataset.narrowList=String(width<80);listResizer.refresh();}
const listResizer=attachColumnResizer({root:widget,handle:byId('chat-column-resizer'),readWidth:()=>chatColumnWidth(listSize(),chatWidthRatio),limits:()=>chatColumnLimits(listSize()),enabled:()=>isRailOpen()&&!panel.hidden,
  setWidth:width=>{chatWidthRatio=width/listSize();try{localStorage.setItem('driveagent:chat-list-width:v1',String(chatWidthRatio));}catch{}refreshListWidth();},
  reset:()=>{chatWidthRatio=null;try{localStorage.removeItem('driveagent:chat-list-width:v1');}catch{}refreshListWidth();}});
window.addEventListener('resize',()=>{listResizer.cancel();refreshListWidth();});
if(window.ResizeObserver){const observer=new ResizeObserver(()=>{if(pageMode)refreshListWidth();});observer.observe(panel);}
input.addEventListener('input',()=>{closeAddMenu();room().draft=input.value;refreshComposer();persist();});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
submit.addEventListener('pointerdown',event=>{if(event.button===0)event.preventDefault();});
form.addEventListener('submit',event=>{event.preventDefault();if(!pageMode||view!=='messages')return;if(widget.dataset.voiceMode==='dictation'){setStatus('Stop dictation before sending.');return;}if(activeRequest){cancelRequest();return;}if(input.value.trim())sendTurn(input.value);else if(event.submitter===submit){input.blur();closeAddMenu();voice.toggleLive();}});
dictateButton.addEventListener('pointerdown',event=>{if(event.button===0)event.preventDefault();});
dictateButton.addEventListener('click',()=>{closeAddMenu();if(widget.dataset.voiceMode!=='dictation')dictationTarget={id:state.active,value:input.value,start:input.selectionStart,end:input.selectionEnd};voice.toggleDictation();});
const fileInput=element('input');fileInput.type='file';fileInput.accept='.txt,.md,.csv,.json';fileInput.hidden=true;fileInput.id='chat-file';form.append(fileInput);
const fileButton=element('button','','Add text file');fileButton.type='button';fileButton.addEventListener('click',()=>{closeAddMenu();fileInput.click();});
addMenu.append(fileButton,element('small','','TXT · CSV · MD · JSON'));
fileInput.addEventListener('change',async()=>{
 const file=fileInput.files?.[0],id=state.active;fileInput.value='';if(!file)return;
 try{
  if(!/\.(txt|md|csv|json)$/i.test(file.name)||file.size>16000)throw Error('Choose a small TXT, CSV, MD or JSON file.');
  const text=await file.text();if(id!==state.active)return;
  const addition='['+file.name+']\n'+text.trim(),draft=[input.value.trim(),addition].filter(Boolean).join('\n\n');
  if(draft.length>2000)throw Error('The file and message must fit within 2,000 characters. Your draft has not changed.');
  input.value=draft;room().draft=draft;refreshComposer();persist();setStatus('File added to draft. Press Send when ready.');
 }catch(error){setStatus(error.message||'This file could not be read.');}
});
addButton.addEventListener('click',()=>{const open=addMenu.hidden;addMenu.hidden=!open;addButton.setAttribute('aria-expanded',String(open));});
document.addEventListener('pointerdown',event=>{if(!addMenu.contains(event.target)&&!addButton.contains(event.target))closeAddMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!addMenu.hidden){event.preventDefault();closeAddMenu();addButton.focus({preventScroll:true});}});
input.addEventListener('keydown',event=>{if(activeRequest&&event.key==='Escape'){event.preventDefault();cancelRequest();}});
input.value=room().draft;refreshComposer();refreshProductImages();renderRooms();renderMessages();syncMenu();syncWorkspace();
