import {ACTION_COLUMN_HEADERS, ACTION_SKUS, ACTION_COLORS} from './actions-model.mjs?v=76';

// Match the unmodified source SKU, never a filtered row index or display label.
export {ACTION_SKUS};
export const ACCOUNTING_ACTION_HEADERS=ACTION_COLUMN_HEADERS;

export function paintActionCell(cell,action){
  cell.classList.toggle('negative-data-cell',action?.direction==='down');
  cell.classList.toggle('positive-data-cell',action?.direction==='up');
  if(action)cell.dataset.actionDirection=action.direction;
  else delete cell.dataset.actionDirection;
  cell.style.backgroundColor=ACTION_COLORS[action?.direction]||'#ffffff';
}

export function addAccountingActions({grid,rows,desktop},ui,getAction){
  if(grid.dataset.actionColumns==='true')return;
  const count=Number(grid.getAttribute('aria-colcount'));
  const original=[...grid.querySelectorAll(':scope > .sheet-cell')];
  if(!count||original.length!==rows.length*count)return;
  const backing=[...grid.querySelectorAll(':scope > :not(.sheet-cell)')];
  const fontSize=desktop&&grid.classList.contains('compact-headers')?12:9;
  const actions=rows.map(row=>!row.isHeader&&!row.isTotal?(ACTION_SKUS[row.sku]||[]).map(getAction):[]);
  // Keep a short preview and all three controls on one compact line at every zoom.
  const columnWidth=144;
  const widths=ACCOUNTING_ACTION_HEADERS.map(()=>columnWidth);
  grid.style.gridTemplateColumns+=' '+widths.map(value=>`calc(${value}px * var(--sheet-scale))`).join(' ');
  grid.dataset.baseWidth=String(Number(grid.dataset.baseWidth)+widths.reduce((a,b)=>a+b,0));
  grid.setAttribute('aria-colcount',String(count+5));grid.dataset.actionColumns='true';
  grid.style.setProperty('--action-font-size',`${fontSize}px`);
  rows.forEach((row,rowIndex)=>{
    const rowCells=original.slice(rowIndex*count,(rowIndex+1)*count);
    const fragment=document.createDocumentFragment();
    ACCOUNTING_ACTION_HEADERS.forEach((heading,offset)=>{
      const cell=document.createElement('div'),dark=row.isHeader||row.isTotal;
      cell.className='sheet-cell sheet-action-cell'+(row.isHeader?' header-cell':row.isTotal?' total-cell':'')+(dark?' black-sheet-cell':'');
      cell.dataset.actionColumn=heading.toLowerCase();
      cell.setAttribute('role',row.isHeader?'columnheader':'cell');cell.setAttribute('aria-colindex',String(count+offset+1));
      Object.assign(cell.style,{gridRow:String(rowIndex+1),gridColumn:String(count+offset+1),
        width:`calc(${widths[offset]}px * var(--sheet-scale))`,height:rowCells[0].style.height,
        backgroundColor:dark?'#000000':'#ffffff',color:dark?'#ffffff':'#000000'});
      if(row.isHeader){cell.textContent=heading;}
      else if(!dark){
        const id=ACTION_SKUS[row.sku]?.[offset],action=actions[rowIndex][offset];
        if(id)cell.dataset.actionId=id;
        paintActionCell(cell,action);
        cell.append(ui.actionCell(action));
      }
      fragment.append(cell);
    });
    grid.insertBefore(fragment,original[(rowIndex+1)*count]||backing[0]||null);
  });
}

export function syncAccountingActions(mount,ui,getAction,changedId){
  mount.querySelectorAll('.sheet-action-cell[data-action-id]').forEach(cell=>{
    if(changedId&&cell.dataset.actionId!==changedId)return;
    const action=getAction(cell.dataset.actionId);
    paintActionCell(cell,action);cell.replaceChildren(ui.actionCell(action));
  });
}
