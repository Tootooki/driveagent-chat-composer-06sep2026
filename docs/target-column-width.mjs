export function targetColumnLimits(viewportWidth){
  const viewport=Math.max(1,Number(viewportWidth)||1);
  const max=Math.max(1,Math.min(720,viewport*.75));
  return {min:Math.min(48,max),max};
}
export function targetColumnWidth(viewportWidth,mobile,ratio=null){
  const {min,max}=targetColumnLimits(viewportWidth);
  const desired=Number.isFinite(ratio)&&ratio>0?viewportWidth*ratio:mobile?viewportWidth*.2:300;
  return Math.min(max,Math.max(min,desired));
}

export function attachTargetColumnResizer({root,viewport,handle,state}){
  const win=root.ownerDocument.defaultView;
  let drag=null;
  const size=()=>viewport.clientWidth||root.clientWidth||win.innerWidth||390;
  const mobile=()=>win.matchMedia('(max-width: 899px)').matches;
  function refresh(){
    const viewportWidth=size(),width=targetColumnWidth(viewportWidth,mobile(),state.targetWidthRatio),limits=targetColumnLimits(viewportWidth);
    root.style.setProperty('--target-frozen-width',`${width}px`);
    root.style.setProperty('--target-viewport-width',`${viewportWidth}px`);
    handle.setAttribute('aria-valuemin',String(Math.round(limits.min)));
    handle.setAttribute('aria-valuemax',String(Math.round(limits.max)));
    handle.setAttribute('aria-valuenow',String(Math.round(width)));
    handle.setAttribute('aria-valuetext',`${Math.round(width)} pixels, ${Math.round(width/viewportWidth*100)}% of table width`);
    return width;
  }
  function setWidth(width){
    const viewportWidth=size(),limits=targetColumnLimits(viewportWidth);
    state.targetWidthRatio=Math.min(limits.max,Math.max(limits.min,width))/viewportWidth;refresh();
  }
  function finish(event){
    if(!drag||(event?.pointerId!==undefined&&event.pointerId!==drag.pointerId))return;
    const id=drag.pointerId;drag=null;root.classList.remove('is-resizing-target');
    if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);
  }
  handle.addEventListener('pointerdown',event=>{
    if(event.isPrimary===false||event.button!==0||drag)return;
    event.preventDefault();handle.focus({preventScroll:true});
    drag={pointerId:event.pointerId,startX:event.clientX,startWidth:refresh(),viewportWidth:size()};root.classList.add('is-resizing-target');
    handle.setPointerCapture?.(event.pointerId);
  });
  win.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    if(event.cancelable)event.preventDefault();setWidth(drag.startWidth+event.clientX-drag.startX);
  },{passive:false});
  win.addEventListener('pointerup',finish);win.addEventListener('pointercancel',finish);
  handle.addEventListener('lostpointercapture',finish);win.addEventListener('blur',()=>finish());
  handle.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();finish();
    if(event.key==='Home'){state.targetWidthRatio=null;refresh();}
    else setWidth(event.key==='End'?targetColumnLimits(size()).max:refresh()+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?32:8));
  });
  handle.addEventListener('dblclick',()=>{finish();state.targetWidthRatio=null;refresh();});
  const resize=()=>{if(drag&&size()!==drag.viewportWidth)finish();refresh();};
  if(win.ResizeObserver){const observer=new win.ResizeObserver(resize);observer.observe(viewport);}
  else win.addEventListener('resize',resize);
  return {refresh};
}
