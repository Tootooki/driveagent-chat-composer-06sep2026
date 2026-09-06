// Export-only links must never remove the navigation when opened on a phone.
const CAPTURE_PARAMS=new URLSearchParams(location.search),DESKTOP_LAYOUT=window.matchMedia('(min-width: 900px)').matches,CAPTURE_MEDIA=window.matchMedia('(min-width: 900px) and (pointer: fine)'),CAPTURE_MODE=CAPTURE_MEDIA.matches&&CAPTURE_PARAMS.get('capture')==='1',CAPTURE_CATEGORY=CAPTURE_PARAMS.get('category');
const syncCaptureMode=()=>document.body.classList.toggle('capture-mode',CAPTURE_MEDIA.matches&&CAPTURE_PARAMS.get('capture')==='1');
syncCaptureMode();CAPTURE_MEDIA.addEventListener('change',syncCaptureMode);
const PERIODS=[["all","All periods","Combined view of every period"],["1d","1 Day","03sep2026"],["7d","7 Days","03jun2026_09jun2026"],["30d","30 Days","11may2026_09jun2026"],["60d","60 Days","11apr2026_09jun2026"],["90d","90 Days","12mar2026_09jun2026"],["180d","180 Days","12dec2025_09jun2026"],["365d","365 Days","10jun2025_09jun2026"],["range","Range","07jun2026_09jun2026"]];
const CATEGORIES=[["all","All products","All product categories","#ffffff"],["pistachio","Pistachio","Pistachio products only","#ffffff"],["kataifi","Kataifi","Kataifi products only","#ffffff"],["choco","Chocos","Chocolate products only","#ffffff"],["pumps","Pumps","Pump products only","#ffffff"],["monitors","Monitors","Monitor products only","#ffffff"]];
const RANGES={"1d":[6,23],range:[24,41],"7d":[42,59],"30d":[60,77],"60d":[78,95],"90d":[96,113],"180d":[114,131],"365d":[132,149]};
const PERIOD_STARTS=[6,24,42,60,78,96,114,132];
const METRICS_PER_PERIOD=18;
const ZOOM_STEPS=[5,8,10,12,15,20,25,30,40,50,60,70,80,90,100,110,125,150,175,200];
const DATED_PERIODS=[{period:'1DAY',date:'03sep2026'},{period:'RANGE',date:'07jun2026_09jun2026'},{period:'7DAYS',date:'03jun2026_09jun2026'},{period:'30DAYS',date:'11may2026_09jun2026'},{period:'60DAYS',date:'11apr2026_09jun2026'},{period:'90DAYS',date:'12mar2026_09jun2026'},{period:'180DAYS',date:'12dec2025_09jun2026'},{period:'365DAYS',date:'10jun2025_09jun2026'}];
const METRIC_HEADERS=['PRONE','SALES$','ADS$','SALESQTY','CTR','CPC','ACOS','TACOS','REFUNQTY','REFUN$','VELDAYS','VELNEED','PROMO','REIMB','PRA+P','PRALL','NETPAY','SHIP'];
const LIVE_HEADERS={2:'PRICE',3:'COG',4:'BSR',5:'STOCK'};
const PRODUCT_NAMES={2:'BUTTER200',3:'CREAM1KG',4:'CREAM200',5:'CREAM5KG',6:'SAUCE700',9:'MINTDUB6',10:'STRAC6',11:'DRIED10KG',12:'DRIED180',13:'DRIED180V2',14:'DRIED400',15:'DRIED5KG',16:'ROAST10KG',17:'ROAST5KG',18:'ROAST180',19:'ROAST400',22:'12PACK',23:'BLUE2',24:'BROWN2',25:'CARAMEL',26:'COCO2',27:'COOKIE',28:'DARK2',29:'DARK200',30:'HAZEL2',31:'MATCHA2',32:'MILK200',33:'ORANGE2',34:'PUMP2',35:'RASP160',36:'STRAW2',37:'WHITE200',38:'MILK200V2',39:'MILK100',40:'WHITE100',41:'WHITE2',42:'WHITE200V2',43:'MILK2',44:'WHITE200V3',45:'BLUE100',46:'BROWN100',47:'COOKIE2',48:'RASP24'};
const neutralColor=(c,f)=>c?(0.2126*c[0]+0.7152*c[1]+0.0722*c[2]>=128?'#ffffff':'#000000'):f;
const numericCellValue=value=>{const raw=String(value||'').trim();if(!raw)return null;const parenthesized=/^\(.*\)$/.test(raw),normalized=raw.replace(/[,$%\s]/g,'').replace(/[()]/g,'');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))return null;const number=Number(normalized);if(!Number.isFinite(number))return null;return parenthesized?-Math.abs(number):number};
const semanticCellTone=(cell,isHeader,ci)=>{if(isHeader||ci<4)return null;const number=numericCellValue(cell.v);if(number===null||number===0)return{backgroundColor:'#ffffff',color:'#000000',className:''};return number>0?{backgroundColor:'rgb(183 223 207)',color:'#000000',className:'positive-data-cell'}:{backgroundColor:'rgb(241 198 198)',color:'#000000',className:'negative-data-cell'}};
const align=v=>v==='LEFT'?'flex-start':v==='RIGHT'?'flex-end':'center';
const valign=v=>v==='TOP'?'flex-start':v==='BOTTOM'?'flex-end':'center';
const textalign=v=>v==='LEFT'?'left':v==='RIGHT'?'right':'center';
const isFrozenColumn=(ci,freezeNameColumn)=>ci===0||(ci===1&&freezeNameColumn);
const mobileLineHeightFor=zoom=>Math.max(24,20*zoom/100);
const isHeaderRow=row=>row[0]&&row[0].v==='IMG'&&row[1]&&row[1].v==='SKU'&&row[2]&&row[2].v==='PRICE'&&row[3]&&row[3].v==='COG';
const datedHeaderFor=(cell,ci)=>{if(ci<6)return null;const period=DATED_PERIODS[Math.floor((ci-6)/METRICS_PER_PERIOD)],metric=METRIC_HEADERS[(ci-6)%METRICS_PER_PERIOD];return period&&metric?{period:period.period,metric,date:period.date}:null};
const liveHeaderFor=ci=>LIVE_HEADERS[ci]?{period:'LIVE',metric:LIVE_HEADERS[ci],date:'03sep2026'}:null;
const CATEGORY_LABELS={PISTACHIO_TOTALS:'PISTACHIO',KATAIFI_TOTALS:'KATAIFI',CHOCO_TOTALS:'CHOCOS',PUMPS_TOTALS:'PUMPS',MONITORS_TOTALS:'MONITORS'};
const CATEGORY_KEYS={PISTACHIO_TOTALS:'pistachio',KATAIFI_TOTALS:'kataifi',CHOCO_TOTALS:'choco',PUMPS_TOTALS:'pumps',MONITORS_TOTALS:'monitors'};
const prepareRow=(row,isHeader,sourceRowIndex,labelType)=>{const totalCell=row.slice(0,4).find(cell=>cell.v&&cell.v.endsWith('_TOTALS')),totalKey=totalCell&&totalCell.v,categoryLabel=totalKey&&CATEGORY_LABELS[totalKey];return row.map((cell,ci)=>{if(isHeader&&ci===0)return{...cell,v:''};if(isHeader&&ci===1)return{...cell,v:labelType==='name'?'':'SKU'};if(categoryLabel&&ci===1)return{...cell,v:categoryLabel,fs:8,h:'CENTER',va:'MIDDLE'};if(categoryLabel&&(ci===0||(ci>=2&&ci<=3)))return{...cell,v:''};if(ci===1&&labelType==='name'&&PRODUCT_NAMES[sourceRowIndex])return{...cell,v:PRODUCT_NAMES[sourceRowIndex]};return cell})};
Promise.all([fetch('sheet-data.json').then(r=>r.json()),fetch('sheet-layout.json').then(r=>r.json())]).then(([sheet,layout])=>{
  const columns=layout.columnWidths,rows=layout.rowHeights,images={...layout.images,'45':'/product-images/image10.png','46':'/product-images/image17.png','47':'/product-images/image13.png'};
  const measureContext=document.createElement('canvas').getContext('2d');
  const lastUsedRow=sheet.data.reduce((last,row,ri)=>row.some(cell=>String(cell.v||'').trim()!=='')||images[String(ri)]?ri:last,-1);
  const usedRows=sheet.data.slice(0,lastUsedRow+1),headerRowIndex=usedRows.findIndex(isHeaderRow),headerEntry=headerRowIndex>=0?{row:usedRows[headerRowIndex],sourceRowIndex:headerRowIndex,isHeader:true,isTotal:false,category:null}:null;
  let activeCategory=null;
  const categorizedRows=usedRows.flatMap((row,sourceRowIndex)=>{if(isHeaderRow(row))return[];const totalCell=row.slice(0,4).find(cell=>cell.v&&cell.v.endsWith('_TOTALS')),totalKey=totalCell&&totalCell.v;if(totalKey&&CATEGORY_KEYS[totalKey])activeCategory=CATEGORY_KEYS[totalKey];return[{row,sourceRowIndex,isHeader:false,isTotal:Boolean(totalKey),category:activeCategory}]});
  const mount=document.getElementById('sheet'),backdrop=document.getElementById('menu-backdrop'),backButton=document.getElementById('menu-back'),closeButton=document.getElementById('menu-close'),applyButton=document.getElementById('apply-view'),menuTitle=document.getElementById('period-menu-title'),status=document.getElementById('current-period'),categoryLabel=document.getElementById('selected-category-label'),periodLabel=document.getElementById('selected-period-label'),zoomOutButton=document.getElementById('zoom-out'),zoomInButton=document.getElementById('zoom-in'),zoomValue=document.getElementById('zoom-value');
  const columnOrderSettings=document.getElementById('column-order-settings'),viewToggle=document.getElementById('mobile-view-toggle'),viewModeIcon=document.getElementById('view-mode-icon');
  const menuScrollPositions=new Map();
  let selectedPeriod='1d',selectedCategory='all',columnLayout='period',labelType='name',zoomLevel=DESKTOP_LAYOUT?100:150,viewMode=DESKTOP_LAYOUT?'desktop':'mobile',compactHeaders=true,freezeNameColumn=false,activeMenuTrigger=null,activePanel=null,canReturnToSettings=false;
  let accountingQuery=document.getElementById('accounting-search')?.value||'';
  let customRange=null;
  const activeHeaderFor=(cell,ci)=>customRange&&ci>=6?{period:'RANGE',metric:METRIC_HEADERS[(ci-6)%METRICS_PER_PERIOD],date:customRange.start+'_'+customRange.end}:datedHeaderFor(cell,ci);
  const activeLiveHeaderFor=ci=>{const header=liveHeaderFor(ci);return header&&customRange?.rows?{...header,date:customRange.end}:header;};
  const rowForRange=entry=>{
    if(!customRange?.rows)return entry.row;
    const key=entry.isTotal?entry.row.slice(0,4).find(cell=>cell.v?.endsWith('_TOTALS'))?.v:entry.row[1]?.v;
    const values=customRange.rows.get(key);
    return entry.row.map((cell,ci)=>{
      if(ci<6&&!(entry.isTotal&&ci<4))return {...cell,v:values?.[ci]||''};
      if(ci>=24&&ci<=41)return {...cell,v:values?.[ci-18]||''};
      return cell;
    });
  };
  const searchable=value=>String(value||'').toLowerCase().replace(/[-_]+/g,' ');
  const matchesSearch=entry=>{
    const terms=searchable(accountingQuery).trim().split(/\s+/).filter(Boolean);
    if(!terms.length)return true;
    // Source category totals do not describe a searched subset of products.
    if(entry.isTotal||!String(entry.row[1]?.v||'').trim())return false;
    const text=searchable([entry.row[1]?.v,PRODUCT_NAMES[entry.sourceRowIndex],entry.category].join(' '));
    return terms.every(term=>text.includes(term));
  };
  if(CAPTURE_MODE){selectedCategory=['pistachio','kataifi','choco','pumps','monitors'].includes(CAPTURE_CATEGORY)?CAPTURE_CATEGORY:'all';zoomLevel=100}
  const visibleColumns=()=>{
    const base=[0,1,2,3,4,5];
    const period=customRange?.sourcePeriod||selectedPeriod;
    if(period!=='all')return[...base,...Array.from({length:RANGES[period][1]-RANGES[period][0]+1},(_,i)=>RANGES[period][0]+i)];
    if(columnLayout==='period')return columns.map((_,i)=>i);
    const metricColumns=[];
    for(let metricOffset=0;metricOffset<METRICS_PER_PERIOD;metricOffset+=1){
      PERIOD_STARTS.forEach(periodStart=>metricColumns.push(periodStart+metricOffset));
    }
    return[...base,...metricColumns];
  };
  const adaptiveWidths=renderRows=>columns.map((_fallbackWidth,ci)=>{const compactSize=DESKTOP_LAYOUT?12:9,padding=DESKTOP_LAYOUT?10:6;if(ci===0)return DESKTOP_LAYOUT?32:20;let widest=0;renderRows.forEach(({row,isHeader})=>{const cell=row[ci];if(!cell)return;const headerParts=isHeader?activeHeaderFor(cell,ci):null,liveParts=isHeader?activeLiveHeaderFor(ci):null,structuredHeader=headerParts||liveParts,lines=structuredHeader?(compactHeaders?[{text:structuredHeader.metric,size:compactSize,weight:700}]:[{text:[structuredHeader.period,structuredHeader.metric,structuredHeader.date].join('  ').toUpperCase(),size:DESKTOP_LAYOUT?11:11/1.5,weight:700}]):[{text:String(cell.v||'').replace(/\s+/g,' '),size:compactHeaders?compactSize:(cell.fs||9),weight:compactHeaders?700:(cell.b?700:400)}];lines.forEach(({text,size,weight})=>{measureContext.font=weight+' '+size+'px Arial';widest=Math.max(widest,measureContext.measureText(text).width+padding)})});const fittedWidth=Math.max(DESKTOP_LAYOUT?28:18,Math.ceil(widest));return ci===1?(DESKTOP_LAYOUT?Math.min(180,Math.max(112,fittedWidth)):Math.min(126,Math.max(84,fittedWidth))):fittedWidth});
  const headerHeightFor=()=>DESKTOP_LAYOUT?32:20;
  const rowHeightFor=(sourceRowIndex,isHeader,isTotal)=>headerHeightFor();
  const updateStatus=()=>{const periodName=PERIODS.find(p=>p[0]===selectedPeriod)[1],categoryName=CATEGORIES.find(c=>c[0]===selectedCategory)[1];periodLabel.textContent=periodName;categoryLabel.textContent=categoryName;columnOrderSettings.hidden=selectedPeriod!=='all';status.textContent=categoryName+' · '+periodName+(selectedPeriod==='all'?' · By '+(columnLayout==='metric'?'metric':'period'):'')+' · '+(labelType==='sku'?'SKU':'Name')+' · '+Math.round(zoomLevel)+'% zoom'};
  const updateViewControls=()=>{mount.classList.toggle('mobile-view',viewMode!=='desktop');mount.classList.toggle('desktop-view',viewMode==='desktop');document.querySelectorAll('[data-view-mode]').forEach(item=>{const active=item.dataset.viewMode===viewMode;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))})};
  const updateZoomControls=()=>{document.documentElement.style.setProperty('--ui-zoom',String(zoomLevel/100));document.documentElement.style.setProperty('--mobile-line-height',mobileLineHeightFor(zoomLevel)+'px');document.documentElement.style.setProperty('--mobile-frame-radius',(3*zoomLevel/100)+'px');zoomValue.textContent=Math.round(zoomLevel)+'%';zoomOutButton.disabled=zoomLevel<=2;zoomInButton.disabled=zoomLevel>=300;document.querySelectorAll('[data-zoom]').forEach(item=>{const active=Number(item.dataset.zoom)===zoomLevel;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))})};
  const fitCurrentView=()=>{const grid=mount.querySelector('.sheet-grid'),contentWidth=Number(grid&&grid.dataset.baseWidth)||1;zoomLevel=Math.max(2,Math.min(100,Math.floor((mount.clientWidth/contentWidth)*100)));if(grid)grid.style.setProperty('--sheet-scale',String(zoomLevel/100));updateZoomControls();updateStatus()};
  const syncPeriodButtons=()=>document.querySelectorAll('[data-period]').forEach(item=>{const active=item.dataset.period===selectedPeriod;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))});
  const setZoom=level=>{zoomLevel=level;viewMode=level===100?'desktop':'custom';updateViewControls();updateZoomControls();updateStatus();const grid=mount.querySelector('.sheet-grid');if(grid)grid.style.setProperty('--sheet-scale',String(zoomLevel/100))};
  const setViewMode=mode=>{viewMode=mode;if(mode==='desktop'||mode==='mobile')zoomLevel=100;if(mode==='full'){customRange=null;selectedPeriod='all';syncPeriodButtons();document.dispatchEvent(new CustomEvent('dolce:accounting-period',{detail:{period:'all'}}))}updateViewControls();render();if(mode==='full')fitCurrentView();else{updateZoomControls();updateStatus()}mount.scrollTo({left:0,top:0,behavior:'auto'})};
  const openMenu=(panel,opener,fromSettings=false)=>{
    const wasOpen=!backdrop.hidden;
    const menuBody=backdrop.querySelector('.period-menu-body');
    if(activePanel&&!backdrop.hidden)menuScrollPositions.set(activePanel,menuBody.scrollTop);
    if(opener){if(activeMenuTrigger&&activeMenuTrigger!==opener)activeMenuTrigger.setAttribute('aria-expanded','false');activeMenuTrigger=opener}
    activePanel=panel;canReturnToSettings=fromSettings;
    const settingsTitle=(DESKTOP_LAYOUT?opener:activeMenuTrigger)?.id==='header-menu'?'Menu':'Settings';
    menuTitle.textContent=panel==='login'?'Login':panel==='products'?'Products':panel==='periods'?'Periods':panel==='column-order'?'Column Order':settingsTitle;
    backButton.setAttribute('aria-label',DESKTOP_LAYOUT?'Back to Settings':'Back to Menu');
    document.querySelectorAll('[data-menu-section]').forEach(section=>{section.hidden=section.dataset.menuSection!==panel});
    applyButton.textContent=panel==='login'?'Back to sheet':'Apply';
    backButton.hidden=!(canReturnToSettings&&panel!=='settings');status.hidden=panel!=='settings';backdrop.hidden=false;backdrop.setAttribute('aria-hidden','false');
    mount.inert=true;menuBody.scrollTop=menuScrollPositions.get(panel)||0;
    requestAnimationFrame(()=>{if(!backdrop.hidden)backdrop.classList.add('open')});if(opener)opener.setAttribute('aria-expanded','true');(backButton.hidden?closeButton:backButton).focus({preventScroll:true});
    document.dispatchEvent?.(new CustomEvent('dolce:menu-state',{detail:{open:true,panel,opener:activeMenuTrigger?.id||'',wasOpen,fromSettings}}));
  };
  const closeMenu=({restoreFocus=true}={})=>{
    const wasOpen=!backdrop.hidden,opener=activeMenuTrigger;
    if(wasOpen&&activePanel)menuScrollPositions.set(activePanel,backdrop.querySelector('.period-menu-body').scrollTop);
    activePanel=null;activeMenuTrigger=null;canReturnToSettings=false;backButton.hidden=true;backdrop.classList.remove('open');backdrop.hidden=true;backdrop.setAttribute('aria-hidden','true');mount.inert=false;
    if(opener){opener.setAttribute('aria-expanded','false');if(wasOpen&&restoreFocus)opener.focus({preventScroll:true})}
    document.dispatchEvent?.(new CustomEvent('dolce:menu-state',{detail:{open:false}}));
  };
  const render=()=>{
    const visible=visibleColumns(),filteredRows=(customRange?.unavailable?[]:categorizedRows).filter(entry=>(selectedCategory==='all'||entry.category===selectedCategory)&&matchesSearch(entry)).map(entry=>({...entry,row:prepareRow(rowForRange(entry),false,entry.sourceRowIndex,labelType)})),preparedHeader=headerEntry?{...headerEntry,row:prepareRow(headerEntry.row,true,headerEntry.sourceRowIndex,labelType)}:null,renderRows=[...(preparedHeader?[preparedHeader]:[]),...filteredRows],contentWidths=adaptiveWidths(renderRows),grid=document.createElement('div');
    grid.className='sheet-grid'+(compactHeaders?' compact-headers':'');grid.setAttribute('role','table');grid.setAttribute('aria-rowcount',renderRows.length);grid.setAttribute('aria-colcount',visible.length);grid.style.setProperty('--sheet-scale',String(zoomLevel/100));grid.style.setProperty('--header-height',headerHeightFor()+'px');grid.style.setProperty('--image-column-width',contentWidths[0]+'px');grid.style.setProperty('--name-column-width',contentWidths[1]+'px');grid.dataset.defaultNameWidth=String(contentWidths[1]);grid.style.gridTemplateColumns=visible.map(i=>i===1?'calc(var(--name-column-width) * var(--sheet-scale))':'calc('+contentWidths[i]+'px * var(--sheet-scale))').join(' ');grid.dataset.baseWidth=String(visible.reduce((total,i)=>total+contentWidths[i],0));
    grid.classList.toggle('freeze-name',freezeNameColumn);
    grid.style.gridTemplateRows='repeat('+renderRows.length+', auto)';
    grid.style.setProperty('--black-columns-width',contentWidths.slice(0,4).reduce((a,b)=>a+b,0)+'px');
    grid.style.setProperty('--frozen-columns-width',(contentWidths[0]+contentWidths[1])+'px');
    renderRows.forEach(({row,sourceRowIndex,isHeader,isTotal},rowIndex)=>visible.forEach((ci,columnIndex)=>{
      const cell=row[ci],headerParts=isHeader?activeHeaderFor(cell,ci):null,liveParts=isHeader?activeLiveHeaderFor(ci):null,isDarkStructure=isHeader||isTotal||(!isHeader&&ci>=1&&ci<=3),semanticTone=isDarkStructure?null:semanticCellTone(cell,isHeader,ci),el=document.createElement('div');el.className='sheet-cell'+(isHeader?' header-cell':'')+(isTotal?' total-cell':'')+(isFrozenColumn(ci,freezeNameColumn)?' frozen-cell':'')+(ci===0?' image-column':ci===1?' name-column':'')+(semanticTone&&semanticTone.className?' '+semanticTone.className:'');el.setAttribute('role',isHeader?'columnheader':'cell');
      if(isDarkStructure||(ci===0&&images[String(sourceRowIndex)]))el.classList.add('black-sheet-cell');
      // Explicit tracks let continuous black backing share the same native
      // sticky grid area without shifting the data or creating extra rows.
      el.style.gridRow=String(rowIndex+1);el.style.gridColumn=String(columnIndex+1);
      Object.assign(el.style,{height:'calc('+rowHeightFor(sourceRowIndex,isHeader,isTotal)+'px * var(--sheet-scale))',width:ci===1?'calc(var(--name-column-width) * var(--sheet-scale))':'calc('+contentWidths[ci]+'px * var(--sheet-scale))',backgroundColor:isDarkStructure?'#000000':semanticTone?semanticTone.backgroundColor:neutralColor(cell.bg,'#ffffff'),color:isDarkStructure?'#ffffff':semanticTone?semanticTone.color:neutralColor(cell.fg,'#000000'),fontSize:'calc('+(cell.fs||9)+'px * var(--sheet-scale))',fontWeight:cell.b?'700':'400',fontStyle:cell.it?'italic':'normal',textDecoration:cell.u?'underline':'none',justifyContent:align(cell.h),alignItems:valign(cell.va),textAlign:textalign(cell.h),whiteSpace:isHeader?'normal':'nowrap'});
      if(isHeader&&ci===0){}
      else if(liveParts){const wrapper=document.createElement('span');wrapper.className='live-header-value';[['live-header-period',liveParts.period],['live-header-metric',liveParts.metric],['live-header-date',liveParts.date]].forEach(([className,value])=>{const part=document.createElement('span');part.className=className;part.textContent=value;wrapper.append(part)});el.title=liveParts.period+'\n'+liveParts.metric+'\n'+liveParts.date;el.append(wrapper)}
      else if(headerParts){const wrapper=document.createElement('span');wrapper.className='dated-header-value';[['dated-header-period',headerParts.period],['dated-header-metric',headerParts.metric],['dated-header-date',headerParts.date]].forEach(([className,value])=>{const part=document.createElement('span');part.className=className;part.textContent=value;wrapper.append(part)});el.title=headerParts.period+'\n'+headerParts.metric+'\n'+headerParts.date;el.append(wrapper)}
      else if(ci===0&&images[String(sourceRowIndex)]){el.classList.add('has-product-image');const img=document.createElement('img');img.className='product-image';img.src=images[String(sourceRowIndex)].replace(/^\//,'');img.alt=(row[1]&&row[1].v?row[1].v:'Product')+' product';img.loading='lazy';el.append(img)}
      else{const span=document.createElement('span');span.className='cell-value';span.textContent=cell.v||'';el.append(span)}
      if(!isHeader&&!isTotal&&(ci===0||ci===1)){
        const sku=String(usedRows[sourceRowIndex]?.[1]?.v||'');
        if(sku){const trigger=document.createElement('button');trigger.type='button';trigger.className='accounting-chat-trigger';trigger.dataset.chatSku=sku;const title=PRODUCT_NAMES[sourceRowIndex]||sku;trigger.setAttribute('aria-label','Chat about '+title);trigger.title='Chat about '+title;while(el.firstChild)trigger.append(el.firstChild);trigger.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('dolce:product-chat',{detail:{sku,title,image:images[String(sourceRowIndex)]?.replace(/^\//,''),opener:trigger}})));el.append(trigger);}
      }
      grid.append(el)
    }));
    for(const className of ['black-column-backplate','frozen-column-backplate']){
      const plate=document.createElement('div');plate.className=className;plate.setAttribute('aria-hidden','true');grid.append(plate);
    }
    renderRows.forEach(({isHeader,isTotal},rowIndex)=>{
      if(!isHeader&&!isTotal)return;
      const plate=document.createElement('div');plate.className='black-band-backplate'+(isHeader?' header-backplate':'');plate.style.gridRow=String(rowIndex+1);plate.setAttribute('aria-hidden','true');grid.append(plate);
    });
    // The action extension adds synthetic columns; source report cells/offsets stay intact.
    window.dolceSheetView={grid,desktop:DESKTOP_LAYOUT,rows:renderRows.map(entry=>({
      isHeader:entry.isHeader,isTotal:entry.isTotal,sku:usedRows[entry.sourceRowIndex]?.[1]?.v||'',
      title:PRODUCT_NAMES[entry.sourceRowIndex],image:images[String(entry.sourceRowIndex)]?.replace(/^\//,'')
    }))};
    document.dispatchEvent(new CustomEvent('dolce:sheet-render',{detail:window.dolceSheetView}));
    mount.replaceChildren(grid);
    if(!filteredRows.length){const empty=document.createElement('p');empty.className='accounting-empty';empty.setAttribute('role','status');empty.textContent=customRange?.unavailable?'No report available for these dates.':'No matching products';mount.append(empty);}
  };
  document.addEventListener('input',event=>{
    if(event.target.id!=='accounting-search')return;
    accountingQuery=event.target.value;render();if(viewMode==='full')fitCurrentView();mount.scrollTop=0;
  });
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{selectedCategory=button.dataset.category;document.querySelectorAll('[data-category]').forEach(item=>{const active=item.dataset.category===selectedCategory;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))});render();if(viewMode==='full')fitCurrentView();else updateStatus();mount.scrollTop=0}));
  document.addEventListener('dolce:accounting-range',event=>{
    customRange=event.detail;selectedPeriod='range';syncPeriodButtons();render();if(viewMode==='full')fitCurrentView();else updateStatus();mount.scrollLeft=0;
  });
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.period==='range'&&document.getElementById('accounting-date-from')){document.dispatchEvent(new CustomEvent('dolce:accounting-edit-range'));return;}
    customRange=null;selectedPeriod=button.dataset.period;syncPeriodButtons();render();if(viewMode==='full')fitCurrentView();else updateStatus();mount.scrollLeft=0;
    document.dispatchEvent(new CustomEvent('dolce:accounting-period',{detail:{period:selectedPeriod}}));
  }));
  zoomOutButton.addEventListener('click',()=>setZoom([...ZOOM_STEPS].reverse().find(level=>level<zoomLevel)||2));
  zoomInButton.addEventListener('click',()=>setZoom(ZOOM_STEPS.find(level=>level>zoomLevel)||300));
  document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>setZoom(Number(button.dataset.zoom))));
  document.querySelectorAll('[data-view-mode]').forEach(button=>button.addEventListener('click',()=>setViewMode(button.dataset.viewMode)));
  document.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>{columnLayout=button.dataset.layout;document.querySelectorAll('[data-layout]').forEach(item=>{const active=item.dataset.layout===columnLayout;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))});render();if(viewMode==='full')fitCurrentView();else updateStatus();mount.scrollLeft=0}));
  document.querySelectorAll('[data-label-type]').forEach(button=>button.addEventListener('click',()=>{labelType=button.dataset.labelType;document.querySelectorAll('[data-label-type]').forEach(item=>{const active=item.dataset.labelType===labelType;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active))});render();if(viewMode==='full')fitCurrentView();else updateStatus();mount.scrollLeft=0}));
  const setNameColumnFrozen=value=>{
    freezeNameColumn=value;
    document.querySelectorAll('[data-name-freeze]').forEach(button=>{const selected=(button.dataset.nameFreeze==='frozen')===freezeNameColumn;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    // Toggle positioning in place so the sheet keeps its scroll position and sizing.
    mount.querySelectorAll('.name-column').forEach(cell=>cell.classList.toggle('frozen-cell',freezeNameColumn));
    mount.querySelector('.sheet-grid')?.classList.toggle('freeze-name',freezeNameColumn);
  };
  document.querySelectorAll('[data-name-freeze]').forEach(button=>button.addEventListener('click',()=>setNameColumnFrozen(button.dataset.nameFreeze==='frozen')));
  const toggleMenu=button=>{
    if(button.id==='header-menu'&&!backdrop.hidden&&activeMenuTrigger===button){closeMenu();return}
    openMenu(button.dataset.mobileMenu,button,false);
  };
  document.querySelectorAll('[data-mobile-menu]').forEach(button=>button.addEventListener('click',()=>toggleMenu(button)));document.querySelectorAll('[data-open-panel]').forEach(button=>button.addEventListener('click',()=>openMenu(button.dataset.openPanel,null,true)));
  const setCompactHeaders=value=>{
    compactHeaders=value;
    viewToggle.setAttribute('aria-pressed',String(compactHeaders));viewToggle.setAttribute('aria-label','Switch to '+(compactHeaders?'full three-line':'compact one-line')+' view');viewModeIcon.classList.toggle('expanded',!compactHeaders);
    document.querySelectorAll('[data-header-mode]').forEach(button=>{const selected=(button.dataset.headerMode==='compact')===compactHeaders;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    render();mount.scrollTo({left:0,top:0,behavior:'smooth'});
  };
  viewToggle.addEventListener('click',()=>setCompactHeaders(!compactHeaders));
  document.querySelectorAll('[data-header-mode]').forEach(button=>button.addEventListener('click',()=>setCompactHeaders(button.dataset.headerMode==='compact')));
  backdrop.addEventListener('mousedown',event=>{if(event.target===backdrop)closeMenu()});backButton.addEventListener('click',()=>openMenu('settings',null,false));closeButton.addEventListener('click',()=>closeMenu());applyButton.addEventListener('click',()=>{if(activePanel==='periods'&&selectedPeriod==='all'){openMenu('column-order',null,canReturnToSettings);return}if(canReturnToSettings&&activePanel!=='settings'){openMenu('settings',null,false);return}closeMenu()});
  document.addEventListener('keydown',event=>{
    if(backdrop.hidden)return;
    if(event.key==='Escape'){event.preventDefault();closeMenu();return}
    if(event.key!=='Tab')return;
    const controls=[...backdrop.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length>0),first=controls[0],last=controls.at(-1);
    if(!first)return;
    if(event.shiftKey&&(document.activeElement===first||!backdrop.contains(document.activeElement))){event.preventDefault();last.focus({preventScroll:true})}
    else if(!event.shiftKey&&(document.activeElement===last||!backdrop.contains(document.activeElement))){event.preventDefault();first.focus({preventScroll:true})}
  });
  // CSS contains each scroll surface; leave finger movement and momentum to the browser.
  window.addEventListener('resize',()=>{if(viewMode==='full')fitCurrentView()});
  updateViewControls();render();updateZoomControls();updateStatus();
  window.dolceMenu=Object.freeze({openPanel:(panel,fromSettings=false,opener=null)=>{if(['settings','workspace','products','periods','column-order'].includes(panel))openMenu(panel,opener,fromSettings)},close:()=>closeMenu()});
  document.dispatchEvent(new CustomEvent('dolce:menu-ready'));
}).catch(error=>{document.querySelector('.loading').textContent='Unable to load the accounting sheet.';console.error(error)});
