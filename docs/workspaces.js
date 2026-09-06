import {TARGET_NODES} from './targets-model.mjs?v=91';
import {createPpcActionState,getPpcAction,setPpcActionStatus,removePpcAction,restorePpcAction} from './ppc-actions-model.mjs?v=84';
import {TABS, CONFIG, createWorkspaceState, selectWorkspace, setOption, setWorkspaceQuery, viewFor} from './workspace-model.mjs?v=118';
import {MOCK_ACTIONS, setMockActionStatus, removeMockAction, restoreMockAction} from './actions-model.mjs?v=76';
import {createActionsUI} from './actions-ui.mjs?v=76';
import {addAccountingActions,syncAccountingActions,paintActionCell} from './accounting-actions.mjs?v=92';
import {createTargetsUI} from './targets-ui.mjs?v=106';
import {createAccountingDates} from './accounting-date-ui.mjs?v=114';

const state=createWorkspaceState();
const ppcRecords=TARGET_NODES.filter(row=>['campaign','keyword','asin','auto','category'].includes(row.type));
const ppcPortfolios=[...new Set(ppcRecords.map(row=>row.portfolio))].map(name=>({id:`portfolio-${name.toLowerCase()}`,name,type:'portfolio'}));
const ppcActionState=createPpcActionState([...ppcRecords,...ppcPortfolios]);
const backdrop=document.getElementById('menu-backdrop'),dialog=backdrop.querySelector('.period-menu');
const sheet=document.getElementById('sheet'),shell=sheet.closest('.workbook-shell'),burger=document.getElementById('header-menu');
const scrollPositions=new Map(),menuPositions=new Map();
let paintedWorkspace='accounting',controlsOpen=false,ppcPageVisited=false,nativeMenuOpen=false,returnToControls=false;
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
const button=(text,handler,className='workspace-choice')=>{const el=node('button',className,text);el.type='button';el.addEventListener('click',handler);return el;};
const menuApi=()=>window.dolceMenu;
const tabLabel=id=>id==='cases'?'AMAZON CASES':id.toUpperCase();

// One inline panel sits in the layout below the header for every workspace.
// The legacy ID preserves the PPC controls' integrations; it is now shared.
const ppcPanel=node('section','ppc-control-panel sheet-control-panel');
ppcPanel.id='ppc-control-panel';ppcPanel.setAttribute('aria-label','Workspace controls');ppcPanel.hidden=true;
shell.insertBefore(ppcPanel,sheet);
const rail=node('nav','workspace-menu-rail targets-workspace-rail page-workspace-rail');rail.setAttribute('aria-label','Main categories');
const tabs=node('div','workspace-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Workspace menu');tabs.setAttribute('aria-orientation','horizontal');
const previous=button('‹',()=>slide(-1),'workspace-rail-arrow');previous.setAttribute('aria-label','Scroll menu tabs left');
const next=button('›',()=>slide(1),'workspace-rail-arrow');next.setAttribute('aria-label','Scroll menu tabs right');
const tabButtons=TABS.map(label=>{
  const id=label.toLowerCase(),el=button(tabLabel(id),()=>chooseTab(id,{toggle:true}),'workspace-tab');
  el.id=`workspace-tab-${id}`;el.dataset.workspaceTab=id;el.dataset.targetWorkspace=id;el.setAttribute('role','tab');tabs.append(el);return el;
});
rail.append(previous,tabs,next);ppcPanel.append(rail);
const panelBody=node('div','sheet-control-body');panelBody.id='workspace-tab-panel';panelBody.setAttribute('role','tabpanel');ppcPanel.append(panelBody);
const rootControls=node('section','workspace-controls');
const densityControls=node('section','workspace-density');
const accountingControls=node('section','accounting-controls');accountingControls.id='accounting-controls';
const accountingSearch=node('input','workspace-search targets-search');
accountingSearch.id='accounting-search';accountingSearch.type='search';accountingSearch.placeholder='SEARCH';
accountingSearch.autocomplete='off';accountingSearch.setAttribute('aria-label','Search accounting products');
const accountingSearchBox=node('div','ui-search-box');accountingSearchBox.append(accountingSearch);accountingControls.append(accountingSearchBox);

// Move the real controls, retaining their IDs and event listeners. There are
// no shadow copies whose selections could drift away from the accounting grid.
function nativeGroup(label,selector,kind){
  const control=document.querySelector(selector);if(!control)return;
  const field=node('fieldset',`accounting-control-group accounting-${kind}`);field.append(node('legend','workspace-sr-only',label),control);accountingControls.append(field);
}
nativeGroup('Headers','.layout-switch[aria-label="Sheet header view"]','headers');
nativeGroup('Freeze name column','.layout-switch[aria-label="Freeze name column"]','freeze');
nativeGroup('Labels','.label-type-switch','labels');
nativeGroup('Products','.category-grid','products');
nativeGroup('Period','.period-grid','periods');
accountingControls.append(createAccountingDates());
// Park the original zoom controls in the DOM so delayed app initialization
// still binds them. Only the global SETTINGS tab displays this single instance.
const zoomParking=node('div');zoomParking.id='global-zoom-parking';zoomParking.hidden=true;shell.append(zoomParking);
const globalZoom=node('fieldset','accounting-control-group global-zoom');globalZoom.id='global-zoom';globalZoom.append(node('legend','workspace-sr-only','Zoom'),document.querySelector('.zoom-panel'));zoomParking.append(globalZoom);
accountingControls.querySelector('[data-category="all"] span').textContent='ALL';
accountingControls.querySelector('[data-name-freeze="regular"] span').textContent='UNFREEZE';
accountingControls.querySelector('[data-name-freeze="frozen"] span').textContent='FREEZE';
const accountingPeriods=accountingControls.querySelector('.period-grid');
accountingPeriods.insertBefore(accountingPeriods.querySelector('[data-period="all"]'),accountingPeriods.querySelector('[data-period="range"]'));
const columnOrder=document.getElementById('column-order-settings');accountingControls.insertBefore(columnOrder,accountingControls.querySelector('.accounting-products'));
accountingControls.querySelectorAll('[data-period]').forEach(el=>{
  const key=el.dataset.period;el.title=el.querySelector('small')?.textContent||'';
  el.querySelector('span').textContent=key==='all'?'ALL':key.toUpperCase();
});
// Keep native controls in the document while the accounting data loads.
// app.js binds them after its asynchronous fetch completes.
panelBody.append(accountingControls);
const workspace=node('section','module-workspace');workspace.id='module-workspace';workspace.hidden=true;workspace.tabIndex=-1;
shell.insertBefore(workspace,backdrop);sheet.tabIndex=-1;
document.body.classList.add('has-workspace-menu','has-inline-sheet-menus');document.body.dataset.activeWorkspace='accounting';
const targetUI=createTargetsUI({getAction:id=>getAction(id),createActionCell:action=>actionUI.actionCell(action),paintActionCell,state:state.targets,
  getStatus:()=>state.options.ppc.status,getView:()=>state.options.ppc.view,
  onView:view=>{state.options.ppc.view=view;document.title=`DRIVE AGENT — ${view}`;},
});
targetUI.controls.id='ppc-tab-panel';

function smooth(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';}
function slide(direction){tabs.scrollBy({left:direction*Math.max(120,tabs.clientWidth*.7),behavior:smooth()});}
function revealTab(el){
  if(!el)return;const left=el.offsetLeft,right=left+el.offsetWidth;
  if(left<tabs.scrollLeft)tabs.scrollTo({left:Math.max(0,left-8),behavior:smooth()});
  else if(right>tabs.scrollLeft+tabs.clientWidth)tabs.scrollTo({left:right-tabs.clientWidth+8,behavior:smooth()});
}
function syncTabs({reveal=false}={}){
  tabButtons.forEach(el=>{
    const selected=el.dataset.workspaceTab===state.tab;
    el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;
    el.setAttribute('aria-controls',panelBody.id);
    if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  panelBody.setAttribute('aria-labelledby',`workspace-tab-${state.tab}`);
  if(reveal)requestAnimationFrame(()=>{if(!ppcPanel.hidden)revealTab(tabButtons.find(el=>el.dataset.workspaceTab===state.tab));});
}
function syncPpcControls(){
  ppcPanel.hidden=!controlsOpen||nativeMenuOpen;
  rail.hidden=ppcPanel.hidden;
  if(!nativeMenuOpen){burger.setAttribute('aria-controls',ppcPanel.id);burger.removeAttribute('aria-haspopup');burger.setAttribute('aria-expanded',String(controlsOpen));}
  sheet.inert=nativeMenuOpen;workspace.inert=nativeMenuOpen||workspace.hidden;
}
function setPpcControls(open){
  controlsOpen=Boolean(open);syncPpcControls();syncTabs({reveal:controlsOpen});
  document.dispatchEvent(new CustomEvent('dolce:ppc-controls-change',{detail:{open:controlsOpen}}));
}
function choices(label,values,selected,change){
  const group=node('fieldset','workspace-choice-group');group.append(node('legend','',label));
  const list=node('div','workspace-choice-list');
  values.forEach(value=>{
    const el=button(value.toUpperCase(),()=>{change(value);list.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===el)));});
    el.setAttribute('aria-pressed',String(value===selected));list.append(el);
  });group.append(list);return group;
}
function paintDensity(){
  if(state.active==='chat'){densityControls.replaceChildren();return;}
  if(state.active==='accounting'){densityControls.replaceChildren(accountingControls);return;}
  if(state.active==='ppc'){densityControls.replaceChildren(targetUI.controls);targetUI.controls.hidden=false;return;}
  densityControls.replaceChildren(choices('Row spacing',['compact','comfortable'],state.density,value=>{
    state.density=value;workspace.dataset.density=value;document.documentElement.style.setProperty('--ui-row-density',value==='comfortable'?'1.4':'1');
  }),button('ACCOUNTING SETTINGS',()=>chooseTab('accounting'),'workspace-choice accounting-settings-link'));
}
function paintControls(){
  if(state.tab!=='settings')zoomParking.append(globalZoom);
  if(state.tab==='ppc'){panelBody.replaceChildren(targetUI.controls);targetUI.controls.hidden=false;}
  else if(state.tab==='accounting'){panelBody.replaceChildren(accountingControls);}
  else if(state.tab==='chat'){panelBody.replaceChildren();}
  else if(state.tab==='settings'){paintDensity();densityControls.prepend(globalZoom);panelBody.replaceChildren(densityControls);}
  else {
    const config=CONFIG[state.tab];if(!config)return;
    rootControls.replaceChildren();
    const search=node('input','workspace-search targets-search');search.type='search';search.placeholder='SEARCH';search.autocomplete='off';
    search.setAttribute('aria-label',`Search ${tabLabel(state.tab).toLowerCase()}`);search.value=state.queries[state.tab]||'';
    search.addEventListener('input',()=>{setWorkspaceQuery(state,state.tab,search.value);paintWorkspace();});
    const searchBox=node('div','ui-search-box');searchBox.append(search);rootControls.append(searchBox);
    config.fields.forEach(field=>rootControls.append(choices(field.label,field.choices,state.options[state.tab][field.key],value=>{
      if(setOption(state,state.tab,field.key,value))paintWorkspace();
    })));
    rootControls.append(node('p','workspace-note','EXAMPLE DATA'));
    panelBody.replaceChildren(rootControls);
  }
  ppcPanel.classList.toggle('is-chat-menu',state.tab==='chat');
  ppcPanel.classList.toggle('is-accounting-menu',panelBody.contains(accountingControls));
  syncTabs();
}
function chooseTab(id,{focus=true,toggle=false}={}){
  if(!TABS.includes(id.toUpperCase()))return;
  if(toggle&&controlsOpen&&state.tab===id){
    setPpcControls(false);burger.focus({preventScroll:true});return;
  }
  menuPositions.set(state.tab,ppcPanel.scrollTop);
  if(id==='ppc'&&!ppcPageVisited)setOption(state,'ppc','view','Targets');
  const previousWorkspace=state.active;
  selectWorkspace(state,id);
  if(state.active!==previousWorkspace)paintWorkspace();
  if(!backdrop.hidden)menuApi()?.close();
  paintControls();setPpcControls(true);ppcPanel.scrollTop=menuPositions.get(id)||0;
  if(focus)tabButtons.find(el=>el.dataset.workspaceTab===id)?.focus({preventScroll:true});
}

// All main entry points expand in place. Only Login keeps the native dialog.
shell.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-mobile-menu],[data-open-panel]');if(!trigger)return;
  const panel=trigger.dataset.mobileMenu||trigger.dataset.openPanel;if(panel==='login')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!menuApi())return;
  if(trigger===burger){
    burger.focus({preventScroll:true});
    if(!backdrop.hidden){menuApi().close();setPpcControls(false);}
    else{if(!controlsOpen)paintControls();setPpcControls(!controlsOpen);}
  }else if(trigger.id==='mobile-settings')chooseTab('settings');
  else chooseTab('accounting');
},{capture:true});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.key!=='Escape'||(state.active!=='chat'&&event.target.closest?.('#chat-widget'))||ppcPanel.hidden||!backdrop.hidden||document.querySelector('dialog[open]'))return;
  event.preventDefault();setPpcControls(false);burger.focus({preventScroll:true});
});
tabs.addEventListener('keydown',event=>{
  const index=tabButtons.indexOf(event.target);if(index<0)return;
  const nextIndex=event.key==='ArrowRight'?(index+1)%tabButtons.length:event.key==='ArrowLeft'?(index-1+tabButtons.length)%tabButtons.length:event.key==='Home'?0:event.key==='End'?tabButtons.length-1:null;
  if(nextIndex===null)return;event.preventDefault();tabButtons.forEach((el,i)=>el.tabIndex=i===nextIndex?0:-1);tabButtons[nextIndex].focus({preventScroll:true});revealTab(tabButtons[nextIndex]);
});
window.addEventListener('resize',()=>{if(!ppcPanel.hidden)revealTab(tabButtons.find(el=>el.dataset.workspaceTab===state.tab));});
document.addEventListener('dolce:menu-state',event=>{
  if(event.detail.open){returnToControls=controlsOpen;nativeMenuOpen=true;}
  else{nativeMenuOpen=false;if(returnToControls){paintControls();controlsOpen=true;}returnToControls=false;}
  syncPpcControls();
});

const getAction=id=>{if(id.startsWith('PPC-'))return getPpcAction(ppcActionState,id);const action=MOCK_ACTIONS.find(item=>item.id===id);return action&&!state.removedActions.includes(id)?{...action,status:state.actionStatuses[id]}:null;};
function refreshActions(id){
  if(id.startsWith('PPC-'))targetUI.syncAction(id);
  else{syncAccountingActions(sheet,actionUI,getAction,id);if(state.active!=='accounting')paintWorkspace();}
  const surface=state.active==='accounting'?sheet:workspace;
  (surface.querySelector(`button[data-action-id="${id}"][data-action-button="info"]`)||surface).focus({preventScroll:true});
}
const actionUI=createActionsUI({getAction,
  onStatus:(id,status)=>{if(!(id.startsWith('PPC-')?setPpcActionStatus(ppcActionState,id,status):setMockActionStatus(state,id,status)))return false;refreshActions(id);return true;},
  onRemove:id=>{if(!(id.startsWith('PPC-')?removePpcAction(ppcActionState,id):removeMockAction(state,id)))return false;refreshActions(id);return true;},
  onRestore:id=>{if(!(id.startsWith('PPC-')?restorePpcAction(ppcActionState,id):restoreMockAction(state,id)))return false;refreshActions(id);return true;},
  returnTarget:()=>state.active==='accounting'?sheet:workspace,
});
document.addEventListener('dolce:sheet-render',event=>addAccountingActions(event.detail,actionUI,getAction));
if(window.dolceSheetView)addAccountingActions(window.dolceSheetView,actionUI,getAction);

const recordDetail=node('dialog','action-detail record-detail');recordDetail.id='record-detail';recordDetail.setAttribute('aria-labelledby','record-detail-title');
const recordHeader=node('div','action-detail-header'),recordTitle=node('h2','','ROW DETAILS');recordTitle.id='record-detail-title';
const recordBody=node('dl','record-detail-fields');let recordOpener=null;
const finishRecord=()=>{(recordOpener?.isConnected?recordOpener:workspace).focus({preventScroll:true});recordOpener=null;};
const closeRecord=()=>{if(typeof recordDetail.close==='function')recordDetail.close();else{recordDetail.removeAttribute('open');finishRecord();}};
const recordClose=button('CLOSE',closeRecord,'action-detail-close');recordHeader.append(recordTitle,recordClose);recordDetail.append(recordHeader,recordBody);document.body.append(recordDetail);
recordDetail.addEventListener('close',finishRecord);recordDetail.addEventListener('cancel',event=>{event.preventDefault();closeRecord();});
recordDetail.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeRecord();}else if(event.key==='Tab'){event.preventDefault();recordClose.focus();}});
function showRecord(data,row,opener){
  recordOpener=opener;recordTitle.textContent=String(row[0]);recordBody.replaceChildren();
  data.headers.forEach((label,i)=>recordBody.append(node('dt','',label.toUpperCase()),node('dd','',row[i]??'—')));
  if(typeof recordDetail.showModal==='function')recordDetail.showModal();else recordDetail.setAttribute('open','');recordClose.focus({preventScroll:true});
}

function paintWorkspace(){
  window.dispatchEvent(new CustomEvent('dolce:workspace-changing',{detail:{active:state.active}}));
  const changed=paintedWorkspace!==state.active;
  if(changed){
    const old=paintedWorkspace==='accounting'?sheet:workspace;
    const table=old.querySelector('.module-table-scroll');
    scrollPositions.set(paintedWorkspace,{left:old.scrollLeft,top:old.scrollTop,tableLeft:table?.scrollLeft||0,tableTop:table?.scrollTop||0});
  }
  const accounting=state.active==='accounting';
  sheet.hidden=!accounting;workspace.hidden=accounting;
  document.body.dataset.activeWorkspace=state.active;workspace.dataset.density=state.density;
  workspace.classList.toggle('is-ppc',state.active==='ppc');workspace.classList.toggle('is-targets',state.active==='ppc');
  workspace.classList.toggle('is-module-sheet',!accounting&&!['ppc','chat'].includes(state.active));
  workspace.classList.toggle('is-chat-page',state.active==='chat');
  document.title=`DRIVE AGENT — ${state.active==='ppc'?state.options.ppc.view:tabLabel(state.active)}`;
  workspace.removeAttribute('aria-labelledby');workspace.setAttribute('aria-label',state.active==='chat'?'Chat':`${tabLabel(state.active)} sheet`);
  if(!accounting){
    const data=viewFor(state);
    if(data.kind==='chat'){
      if(!workspace.contains(document.getElementById('chat-widget')))workspace.replaceChildren();
    }else if(data.kind==='targets'){
      ppcPageVisited=true;if(!workspace.contains(targetUI.root))workspace.replaceChildren(targetUI.root);targetUI.render();
    }else{
      const oldTable=workspace.querySelector('.module-table-scroll');
      const saved=changed?scrollPositions.get(state.active):{tableLeft:oldTable?.scrollLeft||0,tableTop:oldTable?.scrollTop||0};
      const tableWrap=node('div','module-table-scroll');tableWrap.tabIndex=0;tableWrap.setAttribute('aria-label',`${data.title} table`);
      const table=node('table','module-table');if(data.id==='actions')table.classList.add('actions-table');
      table.append(node('caption','workspace-sr-only',`${data.title} — example data`));
      const head=node('thead'),headerRow=node('tr'),totalRow=node('tr','module-totals');
      data.headers.forEach((text,i)=>{
        const th=node('th','',text.toUpperCase());th.scope='col';headerRow.append(th);
        totalRow.append(node('td','',data.totals?.[i]??''));
      });head.append(headerRow,totalRow);table.append(head);
      const body=node('tbody');
      data.rows.forEach((row,index)=>{
        const tr=node('tr');
        row.forEach((value,column)=>{
          const cell=node(column===0?'th':'td');if(column===0)cell.scope='row';
          if(data.id==='actions'&&column>0){
            const action=data.actionSlots[index][column-1];cell.className='action-slot-cell';cell.dataset.actionColumn='action'+column;
            paintActionCell(cell,action);cell.append(actionUI.actionCell(action));
          }else{
            if(column===0){
              const name=node('span','module-name-text',value),wrap=node('span','module-name-content');
              const info=button('i',event=>showRecord(data,row,event.currentTarget),'module-info');
              info.setAttribute('aria-label',`View ${value}`);info.setAttribute('aria-haspopup','dialog');info.setAttribute('aria-controls','record-detail');
              wrap.append(info,name);cell.append(wrap);
            }else cell.textContent=value;
            cell.title=String(value);
            if(/^(type|status|state|stage|readiness|priority)$/i.test(data.headers[column]))cell.classList.add('module-metadata');
            if(data.toneColumns?.[column])cell.dataset.tone=data.toneColumns[column];
          }tr.append(cell);
        });body.append(tr);
      });
      table.append(body);tableWrap.append(table);workspace.replaceChildren(tableWrap);
      if(!data.rows.length)workspace.append(node('p','module-empty','No rows match these filters. Change your selection or clear SEARCH.'));
      tableWrap.scrollLeft=saved?.tableLeft||0;tableWrap.scrollTop=saved?.tableTop||0;
    }
  }
  paintedWorkspace=state.active;syncTabs();syncPpcControls();
  if(changed){const target=accounting?sheet:workspace,position=scrollPositions.get(state.active)||{left:0,top:0};target.scrollTo({left:position.left,top:position.top,behavior:'auto'});}
  window.dispatchEvent(new CustomEvent('dolce:workspace-change'));
}
document.getElementById('mobile-view-toggle').addEventListener('click',()=>{selectWorkspace(state,'accounting');paintWorkspace();paintControls();});
let initialWorkspaceApplied=false;
function ready(){
  if(!initialWorkspaceApplied){
    initialWorkspaceApplied=true;
    const query=new URLSearchParams(location.search),initial=query.get('workspace');
    if(['targets','asins','campaigns','portfolios'].includes(initial)||initial==='ppc'){
      selectWorkspace(state,'ppc');setOption(state,'ppc','view',({targets:'Targets',asins:'ASINs',campaigns:'Campaigns',portfolios:'Portfolios'})[initial==='ppc'?query.get('view'):initial]||'Targets');paintWorkspace();
    }else if(initial&&TABS.includes(initial.toUpperCase())){selectWorkspace(state,initial);paintWorkspace();}
    controlsOpen=query.get('menu')==='open';
  }
  paintControls();syncTabs();syncPpcControls();if(controlsOpen)setPpcControls(true);
}
document.addEventListener('dolce:menu-ready',ready,{once:true});if(menuApi())ready();
