import {TARGET_PERIODS,TARGET_DATE_START,TARGET_DATE_END,TARGET_RECORD_TYPES,TARGET_COLORS,TARGET_TYPE_COLORS,targetInfoForeground,flattenTargets,targetsView,formatTargetMetric,targetMetricTone,targetPerformance,targetPeriods,targetLabel,targetDateRangeError,setTargetDateRange,setTargetPeriod,selectedTargetFilters,toggleTargetFilter,targetMatchLabel} from './targets-model.mjs?v=91';
import {attachTargetColumnResizer} from './target-column-width.mjs?v=84';

const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const control=(text,label,handler)=>{const button=el('button','',text);button.type='button';button.setAttribute('aria-label',label);button.addEventListener('click',handler);return button;};
const typeLabels={total:'TOTAL',portfolio:'PORTFOLIO',campaign:'CAMPAIGN',group:'AD GROUP',keyword:'KEYWORD',asin:'ASIN TARGET',term:'SEARCH TERM',asinTerm:'ASIN MATCH',auto:'AUTO TARGET',autoTerm:'AUTO MATCH',category:'CATEGORY',categoryTerm:'ASIN MATCH'};

export function createTargetsUI({getAction,createActionCell,paintActionCell,state,getStatus,getView=()=>'Targets',onView}){
  const root=el('section','targets-workspace');root.setAttribute('aria-labelledby','targets-title');
  const title=el('h1','workspace-sr-only','TARGETS');title.id='targets-title';root.append(title);
  const controls=el('div','targets-controls');root.append(controls);
  const picker=el('div','targets-filter-picker');picker.setAttribute('role','group');picker.setAttribute('aria-label','Target filters');
  const entityRow=el('div','target-filter-row target-entity-filters');entityRow.setAttribute('role','group');entityRow.setAttribute('aria-label','Record types');
  const attributeRow=el('div','target-filter-row target-attribute-filters');attributeRow.setAttribute('role','group');attributeRow.setAttribute('aria-label','Ad types, matching and placement');
  picker.append(entityRow,attributeRow);
  const entityOptions=[['CAMPAIGNS','Campaigns','All'],['ASINS','ASINs','ASINs'],['KEYWORDS','Keywords','Keywords'],['AUTO','Auto','Auto'],['CATEGORY','Categories','Categories']];
  const entityButtons=entityOptions.map(([label,value,kind])=>{
    const button=control(label,`Filter ${label.toLowerCase()}`,()=>{
      toggleTargetFilter(state,'entities',value,getView());
      const selected=selectedTargetFilters(state,'entities');
      onView(selected.length===1&&selected[0]==='Campaigns'?'Campaigns':selected.length===1&&selected[0]==='ASINs'?'ASINs':'Targets');
      render();tableWrap.scrollTop=0;
    });button.dataset.targetKind=kind;button.dataset.targetView=value==='Campaigns'?'Campaigns':value==='ASINs'?'ASINs':'Targets';button.dataset.filterValue=value;button.title='Select or clear independently';entityRow.append(button);return {button,value};
  });
  const attributeOptions=[['SP','adTypes','Sponsored Products'],['SB','adTypes','Sponsored Brands'],['SD','adTypes','Sponsored Display'],['EXACT','matchTypes','Exact keyword or ASIN target'],['BROAD','matchTypes','Broad keyword match'],['PHRASE','matchTypes','Phrase keyword match'],['EXPANDED','matchTypes','Expanded ASIN targeting'],['TOS','placements','Top of Search placement']];
  const attributeButtons=attributeOptions.map(([value,group,label])=>{
    const button=control(value,`Filter ${label}`,()=>{toggleTargetFilter(state,group,value);render();tableWrap.scrollTop=0;});
    button.dataset.filterGroup=group;button.dataset.filterValue=value;
    if(group==='adTypes')button.dataset.adType=value;
    button.title=label;attributeRow.append(button);return {button,value,group};
  });
  const search=el('input','targets-search');search.type='search';search.placeholder='SEARCH';search.setAttribute('aria-label','Search targets');
  const searchBox=el('div','ui-search-box');searchBox.append(search);
  search.addEventListener('focus',()=>{search.placeholder='';});search.addEventListener('blur',()=>{search.placeholder='SEARCH';});
  search.addEventListener('input',()=>{state.query=search.value;renderTable();tableWrap.scrollTop=0;});
  const periodBar=el('div','targets-periods');periodBar.setAttribute('role','group');periodBar.setAttribute('aria-label','Performance period');
  let dateDraft=null;
  const periodButtons=[...TARGET_PERIODS,'RANGE'].map(period=>{
    const button=control(period,period==='RANGE'?'Choose a custom date range':`Show ${period==='ALL'?'all available history':period}`,()=>{
      setTargetPeriod(state,period);dateDraft=null;render();tableWrap.scrollLeft=0;
      if(period==='RANGE')fromDate.focus({preventScroll:false});
    });button.dataset.targetPeriod=period;periodBar.append(button);return button;
  });
  const dates=el('div','targets-dates');dates.setAttribute('role','group');dates.setAttribute('aria-label','Date range');
  const dateDisplays=new Map(),months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function syncDateDisplay(input){
    const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(input.value);
    dateDisplays.get(input).textContent=parts?`${months[Number(parts[2])-1]} ${Number(parts[3])} ${parts[1]}`:'DATE';
  }
  function dateInput(label,id){
    const wrapper=el('label','target-date-field');wrapper.htmlFor=id;
    const input=el('input','target-date-input');input.type='date';input.id=id;input.min=TARGET_DATE_START;input.max=TARGET_DATE_END;input.required=true;input.setAttribute('aria-label',`${label} date`);input.setAttribute('aria-describedby','target-date-error');
    const display=el('span','target-date-value');display.setAttribute('aria-hidden','true');dateDisplays.set(input,display);
    input.addEventListener('input',()=>syncDateDisplay(input));
    // Show native segments only while editing with a keyboard; touch keeps the centered label.
    input.addEventListener('keydown',event=>{if(!['Tab','Escape','Enter',' '].includes(event.key))wrapper.classList.add('is-date-editing');});
    input.addEventListener('blur',()=>wrapper.classList.remove('is-date-editing'));
    input.addEventListener('pointerdown',()=>wrapper.classList.remove('is-date-editing'));
    wrapper.append(input,display);dates.append(wrapper);return input;
  }
  const fromDate=dateInput('FROM','target-date-from'),toDate=dateInput('TO','target-date-to');
  const dateError=el('p','target-date-error');dateError.id='target-date-error';dateError.setAttribute('role','status');dateError.setAttribute('aria-live','polite');dateError.hidden=true;
  dates.append(dateError);
  function syncDates(){
    const period=targetPeriods(state)[0],values=dateDraft||{start:period.start,end:period.end};
    fromDate.value=values.start;toDate.value=values.end;
    const error=dateDraft?targetDateRangeError(values.start,values.end):'';
    dateError.textContent=error?`${error} The table still shows the last valid dates.`:'';dateError.hidden=!error;
    for(const input of [fromDate,toDate]){input.setAttribute('aria-invalid',String(Boolean(error)));syncDateDisplay(input);}
  }
  function changeDates(){
    dateDraft={start:fromDate.value,end:toDate.value};
    if(!setTargetDateRange(state,dateDraft.start,dateDraft.end)){syncDates();return;}
    dateDraft=null;render();tableWrap.scrollLeft=0;
  }
  fromDate.addEventListener('change',changeDates);toDate.addEventListener('change',changeDates);
  controls.append(searchBox,picker,periodBar,dates);
  const summary=el('p','targets-summary workspace-sr-only');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');root.append(summary);
  const gridArea=el('div','targets-grid-area');
  const tableWrap=el('div','targets-scroll');tableWrap.tabIndex=0;tableWrap.setAttribute('role','region');tableWrap.setAttribute('aria-label','Targets table, scroll for more metrics');
  const table=el('table','targets-table');table.id='targets-table';table.append(el('caption','workspace-sr-only','Standalone records with one filtered totals row. Each total counts matching search terms once.'));
  const thead=el('thead'),tbody=el('tbody');table.append(thead,tbody);tableWrap.append(table);
  const handle=el('div','target-column-resizer');handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');
  handle.setAttribute('aria-label','Resize frozen target column');handle.setAttribute('aria-controls','targets-table');handle.setAttribute('aria-describedby','target-resize-help');
  // The edge remains draggable and keyboard accessible, without a visible marker.
  const resizeHelp=el('span','workspace-sr-only','Drag the right edge to resize. Arrow keys adjust width; Home resets to the default.');resizeHelp.id='target-resize-help';
  gridArea.append(tableWrap,handle);root.append(gridArea,resizeHelp);
  const columnResizer=attachTargetColumnResizer({root,viewport:tableWrap,handle,state});
  const empty=el('p','targets-empty','No records match. Clear the search or change a filter.');empty.hidden=true;root.append(empty);

  const dialog=el('dialog','action-detail target-detail');dialog.id='target-detail';dialog.setAttribute('aria-labelledby','target-detail-title');dialog.setAttribute('aria-describedby','target-detail-note');
  const dialogHeader=el('div','action-detail-header'),dialogTitle=el('h2');dialogTitle.id='target-detail-title';
  let opener=null;
  const finish=()=>{(opener?.isConnected?opener:tableWrap).focus({preventScroll:true});opener=null;};
  const close=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');finish();}};
  const closeButton=control('CLOSE','Close target details',close);closeButton.className='action-detail-close';dialogHeader.append(dialogTitle,closeButton);
  const dialogBody=el('div','action-detail-body');dialog.append(dialogHeader,dialogBody);document.body.append(dialog);
  dialog.addEventListener('close',finish);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){event.preventDefault();closeButton.focus({preventScroll:true});}
  });
  function openDetails(row,button){
    opener=button;dialogTitle.textContent=`${typeLabels[row.type]} · ${row.name}`;
    const note=el('p','action-detail-notice','Illustrative Targets example. These figures and ASINs are fictional; no live advertising account is connected.');note.id='target-detail-note';
    const context=el('dl','target-detail-fields');
    const fields=[['Record type',TARGET_RECORD_TYPES[row.type]],['Name',row.name],['Keyword / target',row.target||'—'],
      ['Portfolio',row.portfolio],['Ad type',row.adType],['ASIN / SKU',row.sku],['Campaign',row.campaign],[row.type==='portfolio'?'Combined campaign budgets':'Campaign budget',formatTargetMetric({format:'money'},row.budget)],
      ['Ad group',row.group||'—'],['Match type',targetMatchLabel(row)||'—'],['Placement',[...new Set(flattenTargets([row]).filter(n=>!n.children.length).map(n=>n.placement))].join(', ')||'—'],['Status',row.status],['Bid',row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid)],['Target ACoS','30.0%']];
    for(const [label,value] of fields)context.append(el('dt','',label),el('dd','',value||'—'));
    dialogBody.replaceChildren(note,context);
    if(['keyword','asin','auto','category'].includes(row.type)){
      const section=el('section','target-detail-period');section.append(el('h3','','Matching search terms'));
      const list=el('ul','target-detail-terms');
      flattenTargets([row]).filter(n=>!n.children.length).forEach(term=>list.append(el('li','',term.name)));
      section.append(list);dialogBody.append(section);
    }
    for(const period of targetPeriods(state)){
      const metrics=targetPerformance(row,period),group=el('section','target-detail-period');group.append(el('h3','',period.label));
      const list=el('dl','target-detail-fields');
      for(const metric of period.metrics)list.append(el('dt','',metric.label),el('dd','',formatTargetMetric(metric,metrics[metric.key])));
      list.append(el('dt','','ROAS'),el('dd','',metrics.roas===null?'—':metrics.roas.toFixed(2)+'×'));group.append(list);dialogBody.append(group);
    }
    dialogBody.append(el('p','action-detail-notice','TACoS is unavailable because this example does not attribute total product sales to individual targets. Totals are recalculated from matching search terms once. Ratios use the summed values. Filters also apply to Campaigns and Portfolios.'));
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');closeButton.focus({preventScroll:true});
  }
  function renderTable(){
    const view=targetsView(state,getStatus(),getView()),headerRow=el('tr','targets-column-heading');
    title.textContent=view.title;tableWrap.setAttribute('aria-label',`${view.title.toLowerCase()} table, scroll for more metrics`);
    for(const [i,label] of view.headers.entries()){
      const th=el('th',i===0?'target-frozen':i<4?'target-meta target-meta-'+['','type','match','status'][i]:'',i===0?'':label.toUpperCase());if(/^ACTION[1-5]$/.test(label))th.classList.add('target-action-heading');th.scope='col';if(i===0)th.setAttribute('aria-label',label);headerRow.append(th);
    }
    let metricIndex=4;
    for(const period of view.periods)for(const metric of period.metrics){
      const th=headerRow.children[metricIndex++];th.className='target-metric-heading';th.dataset.metric=metric.key;th.dataset.period=period.key;
      if(metric.key==='tacos')th.title='Total sales attribution is not available for this target example.';
    }
    thead.replaceChildren(headerRow);
    const fragment=document.createDocumentFragment();
    for(const row of [view.totalRecord,...view.targetRecords]){
      const tr=el('tr',`${row.type==='total'?'target-totals':'target-row'} target-row-${row.type}`);tr.dataset.targetId=row.id;tr.dataset.recordType=TARGET_RECORD_TYPES[row.type];
      const nameCell=el('th','target-frozen');nameCell.scope='row';
      const nameWrap=el('div','target-name-content');
      const label=el('span','target-name',targetLabel(row));label.title=targetLabel(row);
      const info=control('',`View ${typeLabels[row.type].toLowerCase()} details for ${row.name}`,()=>openDetails(row,info));info.className='target-info';info.dataset.targetInfo=row.id;
      info.setAttribute('aria-haspopup','dialog');info.setAttribute('aria-controls','target-detail');
      info.style.color=TARGET_TYPE_COLORS[row.type];
      const infoInk=targetInfoForeground(TARGET_TYPE_COLORS[row.type]);
      const svgNS='http://www.w3.org/2000/svg',icon=document.createElementNS(svgNS,'svg');icon.setAttribute('viewBox','0 0 1024 1024');icon.setAttribute('aria-hidden','true');
      for(const [tag,attributes] of [['circle',{cx:512,cy:512,r:480,fill:'currentColor'}],['circle',{cx:512,cy:288,r:54,fill:infoInk}],['rect',{x:458,y:414,width:108,height:376,rx:54,fill:infoInk}]]){
        const shape=document.createElementNS(svgNS,tag);Object.entries(attributes).forEach(([key,value])=>shape.setAttribute(key,String(value)));icon.append(shape);
      }
      info.append(icon);
      if(row.type==='total')nameCell.setAttribute('aria-label','Filtered totals');
      else{ nameWrap.append(info,label);nameCell.append(nameWrap); }
      tr.append(nameCell);
      for(const [key,value] of [['type',typeLabels[row.type]],['match',targetMatchLabel(row)],['status',row.status||'']]){
        const cell=el('td',`target-meta target-meta-${key}`,row.type==='total'?'':value);cell.title=row.type==='total'?'':value;tr.append(cell);
      }
      view.periods.forEach((period,index)=>{
        for(const metric of period.metrics){
          const value=row.performance[index][metric.key],cell=el('td','target-metric',row.type==='total'&&value==null?'':formatTargetMetric(metric,value));
          cell.dataset.period=period.key;cell.dataset.metric=metric.key;
          const tone=targetMetricTone(metric,value,row);
          if(tone&&row.type!=='total'){cell.style.backgroundColor=TARGET_COLORS[tone];cell.dataset.tone=tone;}
          if(metric.key==='tacos')cell.title='Unavailable: total product sales are not attributed to individual targets.';tr.append(cell);
        }
      });
      for(const value of [row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid),row.sku||'—',row.campaign||'—',row.group||'—']){
        const cell=el('td','target-context',row.type==='total'?'':value);cell.title=row.type==='total'?'':value;tr.append(cell);
      }
      const slots=row.type==='total'?Array(5).fill(null):view.actionSlots[view.targetRecords.indexOf(row)];
      for(let slot=0;slot<5;slot++){
        const cell=el('td','target-action-cell');cell.dataset.actionColumn=`action${slot+1}`;
        if(row.type!=='total'){
          const action=slots[slot];cell.dataset.actionId=action.id;const current=getAction(action.id);paintActionCell(cell,current);cell.append(createActionCell(current));
        }
        tr.append(cell);
      }
      if(row.type==='total')thead.append(tr);else fragment.append(tr);
    }
    tbody.replaceChildren(fragment);empty.hidden=Boolean(view.targetRecords.length);empty.textContent='No records match these filters. Clear a selection or the search. This example contains SP records.';tableWrap.hidden=false;gridArea.hidden=false;handle.hidden=false;columnResizer.refresh();
    const c=view.counts;summary.textContent=`${view.targetRecords.length} standalone ${getView().toLowerCase()} · one filtered total · ${c.campaigns} campaigns · ${c.groups} ad groups · ${c.keywords} keywords · ${c.asins} ASINs · ${c.auto} auto · ${c.categories} categories · ${c.terms} search terms${getStatus()==='All'?'':` · ${getStatus()}`}`;
    return view;
  }
  function render(){
    entityButtons.forEach(({button,value})=>button.setAttribute('aria-pressed',String(selectedTargetFilters(state,'entities',getView()).includes(value))));
    attributeButtons.forEach(({button,group,value})=>button.setAttribute('aria-pressed',String(selectedTargetFilters(state,group).includes(value))));
    periodButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.targetPeriod===state.period)));
    syncDates();
    search.value=state.query;
    renderTable();
  }
  function syncAction(id){
    for(const cell of tbody.querySelectorAll('.target-action-cell')){
      if(cell.dataset.actionId!==id)continue;
      const action=getAction(id);paintActionCell(cell,action);cell.replaceChildren(createActionCell(action));
    }
  }
  return {root,render,tableWrap,controls,syncAction};
}
