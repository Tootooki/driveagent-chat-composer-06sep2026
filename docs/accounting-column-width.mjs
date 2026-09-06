import {attachColumnResizer} from './column-resizer.mjs?v=120';
export function installAccountingColumnResizer({doc=document,win=window}={}){
 const mount=doc.getElementById('sheet'),shell=mount?.closest('.workbook-shell');if(!mount||!shell)return;
 const handle=doc.createElement('div');handle.id='accounting-column-resizer';handle.className='column-resizer accounting-column-resizer';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label','Resize frozen Accounting columns');handle.setAttribute('aria-controls','sheet');handle.hidden=true;shell.append(handle);
 let grid=null,ratio=null,frame=0;
 try{const saved=Number(win.localStorage.getItem('driveagent:accounting-column-width:v1'));if(saved>0&&saved<1)ratio=saved;}catch{}
 const viewport=()=>mount.clientWidth||win.innerWidth||390;
 const number=name=>parseFloat(grid?.style.getPropertyValue(name))||0;
 const scale=()=>number('--sheet-scale')||1;
 const limits=()=>({min:Math.min(viewport()*.75,number('--image-column-width')*scale()+40),max:Math.max(48,Math.min(720,viewport()*.75))});
 const width=()=>grid?(number('--image-column-width')+number('--name-column-width'))*scale():80;
 const enabled=()=>Boolean(grid?.classList.contains('freeze-name')&&!mount.hidden&&!mount.inert);
 const persist=()=>{try{if(ratio===null)win.localStorage.removeItem('driveagent:accounting-column-width:v1');else win.localStorage.setItem('driveagent:accounting-column-width:v1',String(ratio));}catch{}};
 function apply(value){
  if(!grid)return;const range=limits(),target=Math.max(range.min,Math.min(range.max,value)),old=number('--name-column-width'),next=target/scale()-number('--image-column-width');
  if(Math.abs(next-old)<.01)return;
  const delta=next-old;grid.style.setProperty('--name-column-width',next+'px');grid.style.setProperty('--frozen-columns-width',(number('--image-column-width')+next)+'px');grid.style.setProperty('--black-columns-width',(number('--black-columns-width')+delta)+'px');grid.dataset.baseWidth=String(Number(grid.dataset.baseWidth)+delta);
 }
 const control=attachColumnResizer({root:shell,handle,limits,readWidth:width,enabled,setWidth:value=>{ratio=value/viewport();apply(value);persist();schedule();},reset:()=>{ratio=null;if(grid)apply((Number(grid.dataset.defaultNameWidth)+number('--image-column-width'))*scale());persist();schedule();}});
 function paint(){
  frame=0;handle.hidden=!enabled();if(!enabled()){control.cancel();return;}
  if(ratio!==null)apply(viewport()*ratio);control.refresh();
  const rows=[...grid.querySelectorAll('.name-column:not(.header-cell):not(.total-cell)')];if(!rows.length){handle.hidden=true;return;}
  const box=mount.getBoundingClientRect(),parent=shell.getBoundingClientRect(),header=grid.querySelector('.header-cell')?.getBoundingClientRect();
  const top=Math.max(box.top,header?.bottom||box.top,rows[0].getBoundingClientRect().top),bottom=Math.min(box.bottom,rows.at(-1).getBoundingClientRect().bottom);
  handle.hidden=bottom<=top;handle.style.left=(box.left-parent.left+width()-7)+'px';handle.style.top=(top-parent.top)+'px';handle.style.height=Math.max(0,bottom-top)+'px';
 }
 function schedule(){if(!frame)frame=win.requestAnimationFrame(paint);}
 const mutation=new win.MutationObserver(schedule);
 function useGrid(view){mutation.disconnect();grid=view?.grid;if(grid){mutation.observe(grid,{attributes:true,attributeFilter:['class','style']});mutation.observe(mount,{attributes:true,attributeFilter:['hidden','inert']});}schedule();}
 doc.addEventListener('dolce:sheet-render',event=>useGrid(event.detail));if(win.dolceSheetView)useGrid(win.dolceSheetView);
 mount.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',()=>{control.cancel();schedule();},{passive:true});win.addEventListener('dolce:workspace-change',schedule);win.addEventListener('dolce:viewportchange',schedule);
 if(win.ResizeObserver){const observer=new win.ResizeObserver(schedule);observer.observe(mount);observer.observe(shell);}
 return{handle,refresh:paint};
}
if(typeof document!=='undefined')installAccountingColumnResizer();
