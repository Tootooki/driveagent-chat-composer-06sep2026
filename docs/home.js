import {TABS} from './workspace-model.mjs?v=118';

// The homepage uses the same category order and rail styles as the demo.
// Its categories are links because each opens a complete workspace document.
const shell=document.querySelector('.workbook-shell');
const homePage=document.getElementById('home-page');
const burger=document.getElementById('header-menu');
const loginButton=document.getElementById('header-login');
const backdrop=document.getElementById('menu-backdrop');
const loginDialog=backdrop.querySelector('.period-menu');
const closeButton=document.getElementById('menu-close');
const applyButton=document.getElementById('apply-view');
const node=(tag,className,text)=>{
  const element=document.createElement(tag);
  if(className)element.className=className;
  if(text!==undefined)element.textContent=text;
  return element;
};
const button=(text,label,handler,className)=>{
  const element=node('button',className,text);element.type='button';
  if(label)element.setAttribute('aria-label',label);
  element.addEventListener('click',handler);return element;
};
const smooth=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
const panel=node('section','ppc-control-panel sheet-control-panel home-control-panel');
panel.id='ppc-control-panel';panel.setAttribute('aria-label','Workspace controls');panel.hidden=true;
const rail=node('nav','workspace-menu-rail targets-workspace-rail page-workspace-rail');
rail.setAttribute('aria-label','Main categories');
const tabs=node('div','workspace-tabs');
const slide=direction=>tabs.scrollBy({left:direction*Math.max(120,tabs.clientWidth*.7),behavior:smooth()});
const previous=button('‹','Scroll menu tabs left',()=>slide(-1),'workspace-rail-arrow');
const next=button('›','Scroll menu tabs right',()=>slide(1),'workspace-rail-arrow');
const links=TABS.map(label=>{
  const id=label.toLowerCase();
  const link=node('a','workspace-tab',id==='cases'?'AMAZON CASES':label);
  link.id='workspace-tab-'+id;link.dataset.workspaceTab=id;link.dataset.targetWorkspace=id;
  link.href='./demo.html?workspace='+(id==='ppc'?'targets':id)+'&menu=open';
  tabs.append(link);return link;
});
rail.append(previous,tabs,next);
panel.append(rail);shell.insertBefore(panel,homePage);
document.body.classList.add('has-workspace-menu','has-inline-sheet-menus');

let menuOpen=false,loginOpen=false;
function sync(){
  panel.hidden=!menuOpen||loginOpen;rail.hidden=panel.hidden;
  burger.setAttribute('aria-controls',panel.id);burger.removeAttribute('aria-haspopup');
  burger.setAttribute('aria-expanded',String(!panel.hidden));
  loginButton.setAttribute('aria-expanded',String(loginOpen));
  homePage.inert=loginOpen;
}
function setMenu(open){
  menuOpen=Boolean(open);sync();
  document.dispatchEvent(new CustomEvent('dolce:ppc-controls-change',{detail:{open:menuOpen}}));
}
function revealLink(link){
  if(!link)return;
  const left=link.offsetLeft,right=left+link.offsetWidth;
  if(left<tabs.scrollLeft)tabs.scrollTo({left:Math.max(0,left-8),behavior:smooth()});
  else if(right>tabs.scrollLeft+tabs.clientWidth)tabs.scrollTo({left:right-tabs.clientWidth+8,behavior:smooth()});
}
tabs.addEventListener('keydown',event=>{
  const index=links.indexOf(event.target);if(index<0)return;
  const nextIndex=event.key==='ArrowRight'?(index+1)%links.length
    :event.key==='ArrowLeft'?(index-1+links.length)%links.length
      :event.key==='Home'?0:event.key==='End'?links.length-1:null;
  if(nextIndex===null)return;
  event.preventDefault();links[nextIndex].focus({preventScroll:true});revealLink(links[nextIndex]);
});
tabs.addEventListener('focusin',event=>{if(links.includes(event.target))revealLink(event.target);});
window.addEventListener('resize',()=>{if(!panel.hidden)revealLink(links.find(link=>link===document.activeElement));});

function openLogin(){
  if(loginOpen){closeLogin();return;}
  loginOpen=true;
  backdrop.querySelectorAll('[data-menu-section]').forEach(section=>{section.hidden=section.dataset.menuSection!=='login';});
  document.getElementById('period-menu-title').textContent='LOGIN';
  const backButton=document.getElementById('menu-back');if(backButton)backButton.hidden=true;
  const status=document.getElementById('current-period');if(status)status.hidden=true;
  applyButton.textContent='BACK TO HOME';
  backdrop.hidden=false;backdrop.setAttribute('aria-hidden','false');sync();
  requestAnimationFrame(()=>{if(loginOpen)backdrop.classList.add('open');});
  closeButton.focus({preventScroll:true});
  document.dispatchEvent(new CustomEvent('dolce:menu-state',{detail:{open:true,panel:'login',opener:loginButton.id,wasOpen:false}}));
}
function closeLogin({restoreFocus=true}={}){
  if(!loginOpen)return;
  loginOpen=false;backdrop.classList.remove('open');backdrop.hidden=true;backdrop.setAttribute('aria-hidden','true');sync();
  if(restoreFocus)loginButton.focus({preventScroll:true});
  document.dispatchEvent(new CustomEvent('dolce:menu-state',{detail:{open:false}}));
}
burger.addEventListener('click',()=>{
  burger.focus({preventScroll:true});
  if(loginOpen){closeLogin({restoreFocus:false});setMenu(true);}
  else setMenu(!menuOpen);
});
loginButton.addEventListener('click',openLogin);
closeButton.addEventListener('click',()=>closeLogin());
applyButton.addEventListener('click',()=>closeLogin());
backdrop.addEventListener('mousedown',event=>{if(event.target===backdrop)closeLogin();});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented)return;
  if(loginOpen){
    if(event.key==='Escape'){event.preventDefault();closeLogin();return;}
    if(event.key!=='Tab')return;
    const controls=[...loginDialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')]
      .filter(element=>!element.closest('[hidden]')&&element.getClientRects().length);
    const first=controls[0],last=controls.at(-1);if(!first)return;
    if(event.shiftKey&&(document.activeElement===first||!loginDialog.contains(document.activeElement))){event.preventDefault();last.focus({preventScroll:true});}
    else if(!event.shiftKey&&(document.activeElement===last||!loginDialog.contains(document.activeElement))){event.preventDefault();first.focus({preventScroll:true});}
    return;
  }
  if(event.key!=='Escape'||!menuOpen||event.target.closest?.('#chat-widget')||document.querySelector('dialog[open]'))return;
  event.preventDefault();setMenu(false);burger.focus({preventScroll:true});
});
sync();
