// Opt-in, local-only readings. Nothing is sent to a server.
if (new URLSearchParams(location.search).get('viewport-debug') === '1') {
  const box=document.createElement('section');box.setAttribute('aria-label','Viewport diagnostics');
  Object.assign(box.style,{position:'absolute',left:'8px',right:'8px',bottom:'8px',zIndex:'300',maxHeight:'45%',overflow:'auto',background:'#fff',color:'#000',border:'1px solid #000',borderRadius:'3px',padding:'10px',font:'11px/1.4 monospace',pointerEvents:'auto'});
  const title=document.createElement('strong');title.textContent='VIEWPORT DIAGNOSTICS — LOCAL ONLY';
  const pre=document.createElement('pre');Object.assign(pre.style,{whiteSpace:'pre-wrap',overflowWrap:'anywhere',font:'inherit'});
  const copy=document.createElement('button');copy.textContent='COPY READINGS';copy.type='button';
  const close=document.createElement('button');close.textContent='CLOSE';close.type='button';
  for(const b of [copy,close])Object.assign(b.style,{padding:'10px',marginRight:'8px',background:'#000',color:'#fff',border:'0',borderRadius:'3px'});
  box.append(title,pre,copy,close);document.querySelector('.workbook-shell').append(box);
  function read(){
    const v=window.visualViewport,s=document.querySelector('.workbook-shell'),h=document.querySelector('.brand-header'),r=document.documentElement;
    const rect=e=>{const b=e.getBoundingClientRect();return{top:b.top,bottom:b.bottom,height:b.height,width:b.width}};
    pre.textContent=JSON.stringify({version:'chrome-viewport-110',browser:navigator.userAgent,window:{width:innerWidth,height:innerHeight,scrollX,scrollY},viewport:v?{width:v.width,height:v.height,offsetTop:v.offsetTop,pageTop:v.pageTop,scale:v.scale}:null,body:rect(document.body),shell:rect(s),header:rect(h),compensation:r.style.getPropertyValue('--chrome-app-top'),frameHeight:r.style.getPropertyValue('--chrome-app-height'),keyboard:r.getAttribute('data-chrome-keyboard')},null,2);
  }
  let pending=false;const update=()=>{if(pending||!box.isConnected)return;pending=true;requestAnimationFrame(()=>{pending=false;read()})};
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(pre.textContent);copy.textContent='COPIED'}catch{copy.textContent='SELECT AND COPY THE READINGS'}});
  close.addEventListener('click',()=>box.remove());
  window.addEventListener('dolce:viewportchange',update);window.addEventListener('resize',update);
  window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);read();
}
