// Shared pointer and keyboard interaction for the Chat and Accounting edges.
export function attachColumnResizer({root,handle,readWidth,limits,setWidth,reset,enabled=()=>true}){
 const win=root.ownerDocument.defaultView;let drag=null;
 function refresh(){const range=limits(),width=readWidth();handle.setAttribute('aria-valuemin',String(Math.round(range.min)));handle.setAttribute('aria-valuemax',String(Math.round(range.max)));handle.setAttribute('aria-valuenow',String(Math.round(width)));handle.setAttribute('aria-valuetext',Math.round(width)+' pixels');return width;}
 function apply(value){const range=limits();setWidth(Math.min(range.max,Math.max(range.min,value)));refresh();}
 function finish(event){if(!drag||(event?.pointerId!==undefined&&event.pointerId!==drag.id))return;const id=drag.id;drag=null;root.classList.remove('is-resizing-column');if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);}
 handle.addEventListener('pointerdown',event=>{if(!enabled()||drag||event.isPrimary===false||event.button!==0)return;event.preventDefault();handle.focus({preventScroll:true});drag={id:event.pointerId,x:event.clientX,width:refresh()};root.classList.add('is-resizing-column');handle.setPointerCapture?.(event.pointerId);});
 win.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;if(!enabled()){finish();return;}if(event.cancelable)event.preventDefault();apply(drag.width+event.clientX-drag.x);},{passive:false});
 win.addEventListener('pointerup',finish);win.addEventListener('pointercancel',finish);win.addEventListener('blur',()=>finish());handle.addEventListener('lostpointercapture',finish);
 handle.addEventListener('keydown',event=>{if(!enabled()||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();finish();if(event.key==='Home'){reset();refresh();}else apply(event.key==='End'?limits().max:refresh()+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?32:8));});
 handle.addEventListener('dblclick',()=>{if(enabled()){finish();reset();refresh();}});
 return{refresh,cancel:()=>finish()};
}
export function chatColumnLimits(viewport){const max=Math.max(48,Math.min(480,viewport*.65,viewport-160));return{min:48,max};}
export function chatColumnWidth(viewport,ratio=null){const {min,max}=chatColumnLimits(viewport);return Math.max(min,Math.min(max,ratio>0?viewport*ratio:Math.min(220,viewport*.25)));}
