// Local navigation prototype. Every non-accounting record is fictional.
import {ACTION_BRAND, ACTION_NOTICE, ACTION_STATUSES, ACTION_COLUMN_HEADERS, createActionStatuses, mockActionsFor} from './actions-model.mjs?v=76';
import {createTargetsState,targetsView} from './targets-model.mjs?v=91';
export const TABS = ['ACCOUNTING', 'PPC', 'CHAT', 'SEO', 'REIMBURSEMENT', 'CASES', 'ACTIONS', 'HISTORY', 'AUTOMATION', 'SERVICES', 'SETTINGS'];
const field=(key,label,choices)=>({key,label,choices});
export const CONFIG = {
  ppc:{fields:[field('view','View',['Campaigns','Targets','ASINs','Portfolios']),field('status','Status',['All','Active','Paused'])]},
  seo:{fields:[field('view','View',['Listings','Keywords']),field('status','Readiness',['All','Review','Ready','Draft']),field('owner','Owner',['All','Maya','Noah','Lea'])]},
  reimbursement:{fields:[field('view','View',['Cases','Evidence']),field('status','Stage',['All','Open','Review','Ready','Paid']),field('priority','Priority',['All','High','Normal'])]},
  cases:{fields:[field('status','Status',['All','Open','In progress','Waiting','Resolved']),field('priority','Priority',['All','High','Normal','Low']),field('owner','Owner',['All','Maya','Noah','Lea'])]},
  actions:{fields:[field('area','Team',['All','PPC','SEO','Pricing','Stock','Reimbursement']),field('status','Status',['All',...ACTION_STATUSES])]},
  history:{fields:[field('area','Team',['All','Accounting','PPC','SEO','Reimbursement','Amazon Cases','Automation','Services']),field('order','Order',['Newest first','Oldest first']),field('status','Result',['All','Reviewed','Prepared','Completed'])]},
  automation:{fields:[field('view','View',['Rules','Runs']),field('status','State',['All','Enabled','Paused']),field('area','Team',['All','Accounting','PPC','SEO','Reimbursement','Amazon Cases'])]},
  services:{fields:[field('service','Service',['All','Accounting','PPC','SEO','Reimbursement','Amazon Cases','Automation','Reporting','Operations']),field('status','Status',['All','Available','Planned'])]},
};
const objects=(keys,rows)=>rows.map(values=>Object.fromEntries(keys.map((key,index)=>[key,values[index]])));
const records = {
  seo:objects(['name','sku','keyword','status','owner','impressions','clicks','rank','note'],[
    ['Pistachio cream 200g','CREAM200','pistachio spread','Ready','Maya',8400,268,12,'Review spread wording in the title'],
    ['Kataifi pastry 400g','DRIED400','shredded pastry','Review','Noah',6100,174,18,'Check pack weight against the main image'],
    ['Chocolate selection','BLUE2','chocolate gift box','Review','Lea',4300,121,23,'Show both bars in the pack-size image'],
    ['Pistachio butter 200g','BUTTER200','pure pistachio butter','Draft','Maya',3900,97,26,'Prepare an ingredient-focused bullet'],
    ['Roasted kataifi 180g','ROAST180','crispy kataifi','Ready','Noah',7200,252,9,'Review texture wording in the draft'],
    ['Pistachio cream 1kg','CREAM1KG','pistachio filling','Review','Maya',5200,161,16,'Clarify the food-service pack size'],
    ['Mint chocolate bars','MINTDUB6','mint chocolate bars','Draft','Lea',2800,67,31,'Prepare a flavor comparison image'],
    ['Pistachio sauce 700g','SAUCE700','pistachio dessert sauce','Ready','Maya',3500,119,14,'Review serving suggestions'],
    ['Roasted kataifi 5kg','ROAST5KG','bulk roasted kataifi','Review','Noah',1900,42,22,'Explain the bulk case contents'],
    ['Dark chocolate 200g','DARK200','dark chocolate bar','Ready','Lea',4700,155,15,'Check the cocoa statement in the draft'],
  ]),
  reimbursement:objects(['id','product','reason','units','amount','status','priority','evidence','updated','next'],[
    ['DEMO-R001','Pistachio cream 200g','Lost inventory',12,84,'Open','High','Inventory adjustment export','2026-09-05','Compare shipment and receipt counts'],
    ['DEMO-R002','Chocolate selection','Damaged return',4,28,'Review','Normal','Return condition record','2026-09-05','Review the returned-unit condition'],
    ['DEMO-R003','Kataifi pastry 400g','Fee discrepancy',8,16,'Ready','Normal','Fee calculation worksheet','2026-09-04','Review the prepared case summary'],
    ['DEMO-R004','Pistachio cream 1kg','Inbound shortage',6,96,'Open','High','Delivery receipt and box count','2026-09-04','Match delivered boxes to receiving data'],
    ['DEMO-R005','Mint chocolate bars','Warehouse damage',5,42.5,'Review','Normal','Inventory event timeline','2026-09-03','Check whether a credit already exists'],
    ['DEMO-R006','Roasted kataifi 180g','Lost inventory',10,65,'Paid','Normal','Sample reimbursement record','2026-09-03','Reconcile the example payment'],
    ['DEMO-R007','Pistachio sauce 700g','Weight fee discrepancy',18,32.4,'Ready','Normal','Sample dimensions and fee lines','2026-09-02','Review the dimension comparison'],
    ['DEMO-R008','Dark chocolate 200g','Missing return',3,21,'Open','Normal','Order and return timeline','2026-09-02','Check the return event sequence'],
    ['DEMO-R009','Roasted kataifi 5kg','Inbound shortage',2,74,'Review','High','Shipment contents and receipt','2026-09-01','Review the two-unit discrepancy'],
    ['DEMO-R010','Pistachio butter 200g','Warehouse damage',7,56,'Paid','Normal','Sample credit reconciliation','2026-09-01','Archive the reconciled example'],
  ]),
  cases:objects(['id','issue','product','status','priority','owner','updated','next'],[
    ['DEMO-C001','Listing suppression','Pistachio cream 200g','Open','High','Maya','2026-09-05 10:20','Review the missing attribute notice'],
    ['DEMO-C002','Variation relationship','Chocolate selection','In progress','Normal','Lea','2026-09-05 09:45','Compare parent and child attributes'],
    ['DEMO-C003','Stranded inventory','Kataifi pastry 400g','Waiting','High','Noah','2026-09-05 09:15','Review the sample support response'],
    ['DEMO-C004','Incorrect product dimension','Pistachio cream 1kg','Open','Normal','Maya','2026-09-04 16:10','Attach the prepared measurement record'],
    ['DEMO-C005','Main image mismatch','Mint chocolate bars','In progress','Normal','Lea','2026-09-04 14:30','Compare catalog and package images'],
    ['DEMO-C006','Duplicate detail page','Roasted kataifi 180g','Waiting','Normal','Noah','2026-09-04 11:05','Collect the two example listing IDs'],
    ['DEMO-C007','Brand attribute correction','Pistachio sauce 700g','Resolved','Low','Maya','2026-09-03 15:40','Verify the corrected example attribute'],
    ['DEMO-C008','Shipment receiving question','Roasted kataifi 5kg','Open','High','Noah','2026-09-03 10:00','Review delivery and receiving events'],
    ['DEMO-C009','Category assignment','Dark chocolate 200g','Resolved','Low','Lea','2026-09-02 13:25','Check the example browse category'],
    ['DEMO-C010','Catalog text correction','Pistachio butter 200g','In progress','Normal','Maya','2026-09-02 09:50','Review the prepared wording evidence'],
  ]),
  history:objects(['name','time','area','product','status','owner','items','note'],[
    ['September report review','2026-09-05 10:30','Accounting','All products','Reviewed','Maya',43,'Reviewed the sample product report'],
    ['Pistachio bid draft','2026-09-05 10:15','PPC','Pistachio cream 200g','Prepared','Noah',3,'Prepared three example bid changes'],
    ['Cream title review','2026-09-05 09:55','SEO','Pistachio cream 200g','Reviewed','Maya',1,'Reviewed the sample title wording'],
    ['Shortage evidence package','2026-09-05 09:40','Reimbursement','Pistachio cream 1kg','Prepared','Lea',4,'Prepared four sample evidence files'],
    ['Suppression task review','2026-09-05 09:20','Amazon Cases','Pistachio cream 200g','Reviewed','Maya',1,'Reviewed the example case checklist'],
    ['Daily report simulation','2026-09-05 09:00','Automation','All products','Completed','Noah',1,'Completed a local rule simulation'],
    ['Service scope draft','2026-09-04 16:30','Services','All products','Prepared','Lea',2,'Prepared two example service briefs'],
    ['Kataifi keyword review','2026-09-04 15:10','SEO','Kataifi pastry 400g','Reviewed','Noah',6,'Reviewed six sample keyword ideas'],
    ['Return credit reconciliation','2026-09-04 13:45','Reimbursement','Roasted kataifi 180g','Completed','Maya',1,'Matched the example credit record'],
    ['Chocolate target draft','2026-09-04 11:20','PPC','Chocolate selection','Prepared','Lea',5,'Prepared five example targeting actions'],
  ]),
  automation:objects(['name','area','status','cadence','last','run','items','next'],[
    ['Daily report preview','Accounting','Enabled','Every morning','2026-09-05 09:00','Simulated completion',43,'Review the generated report preview'],
    ['Listing review preview','SEO','Paused','Weekly','2026-09-01 10:00','Paused',0,'Review scope before enabling'],
    ['Case evidence preview','Reimbursement','Enabled','Weekly','2026-09-05 08:50','Simulated completion',4,'Review the evidence checklist'],
    ['Budget pacing preview','PPC','Enabled','Daily','2026-09-05 08:45','Simulated completion',6,'Review the sample pacing flags'],
    ['Search term review preview','PPC','Paused','Every Monday','2026-09-01 09:30','Paused',0,'Set the example review criteria'],
    ['Catalog attribute preview','SEO','Enabled','Weekly','2026-09-04 10:00','Simulated completion',10,'Review the sample attribute checks'],
    ['Support follow-up preview','Amazon Cases','Enabled','Every weekday','2026-09-05 08:30','Simulated completion',3,'Review cases awaiting a reply'],
    ['Settlement check preview','Accounting','Paused','Every two weeks','2026-08-29 10:00','Paused',0,'Choose an example settlement period'],
    ['Credit reconciliation preview','Reimbursement','Enabled','Weekly','2026-09-04 09:00','Simulated completion',2,'Review matched example credits'],
    ['Listing status preview','Amazon Cases','Paused','Daily','2026-09-02 09:00','Paused',0,'Review which example listings to watch'],
  ]),
  services:objects(['name','service','detail','status','owner','delivery','next'],[
    ['Monthly reporting','Accounting','Product sales, costs and profit review','Available','Maya','Monthly','Review the sample reporting scope'],
    ['Settlement reconciliation','Accounting','Match sample settlement and report lines','Planned','Maya','Every two weeks','Prepare the example reconciliation brief'],
    ['Campaign review','PPC','Campaign and target performance review','Available','Noah','Weekly','Review the example campaign list'],
    ['Search term review','PPC','Keyword and product-target review','Planned','Noah','Weekly','Choose an example search-term period'],
    ['Listing and keyword review','SEO','Product text, images and keyword checks','Available','Lea','Monthly','Review the sample listing brief'],
    ['Reimbursement review','Reimbursement','Sample inventory and fee discrepancies','Available','Maya','Weekly','Review the prepared evidence list'],
    ['Amazon case preparation','Amazon Cases','Support issue and evidence organization','Planned','Lea','Per case','Review an example support task'],
    ['Automation setup','Automation','Local rule and approval-flow previews','Planned','Noah','Per setup','Draft the example rule checklist'],
    ['Custom report layout','Reporting','Product and period reporting layouts','Available','Maya','Per report','Review the example column selection'],
    ['Operations review','Operations','Cross-team task and handoff review','Planned','Lea','Monthly','Review the sample team handoffs'],
  ]),
};
const money=value=>'$'+value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const table=(headers,cells,sumColumns={},toneColumns={})=>({headers,cells,sumColumns,toneColumns});
const tables = {
  seo:options=>options.view==='Keywords'
    ? table(['Keyword','Product','SKU','Readiness','Owner','30D_IMPRESSIONS','30D_CLICKS','Rank','Next step'],r=>[r.keyword,r.name,r.sku,r.status,r.owner,r.impressions,r.clicks,r.rank,r.note],{5:'number',6:'number'},{5:'neutral',6:'neutral',7:'neutral'})
    : table(['Listing','SKU','Readiness','Owner','30D_IMPRESSIONS','30D_CLICKS','Next step'],r=>[r.name,r.sku,r.status,r.owner,r.impressions,r.clicks,r.note],{4:'number',5:'number'},{4:'neutral',5:'neutral'}),
  reimbursement:options=>options.view==='Evidence'
    ? table(['Case','Product','Evidence','Stage','Priority','Updated','Next step'],r=>[r.id,r.product,r.evidence,r.status,r.priority,r.updated,r.next])
    : table(['Case','Product','Reason','Units','Amount','Stage','Priority','Updated','Next step'],r=>[r.id,r.product,r.reason,r.units,money(r.amount),r.status,r.priority,r.updated,r.next],{3:'number',4:'money'},{3:'neutral',4:'positive'}),
  cases:()=>table(['Case task','Case ID','Product','Status','Priority','Owner','Updated','Next step'],r=>[r.issue,r.id,r.product,r.status,r.priority,r.owner,r.updated,r.next]),
  history:()=>table(['Event','Updated','Team','Product','Result','Owner','Items','Detail'],r=>[r.name,r.time,r.area,r.product,r.status,r.owner,r.items,r.note],{6:'number'},{6:'neutral'}),
  automation:options=>options.view==='Runs'
    ? table(['Rule','Team','State','Last simulation','Result','Items','Next step'],r=>[r.name,r.area,r.status,r.last,r.run,r.items,r.next],{5:'number'},{5:'neutral'})
    : table(['Rule','Team','State','Cadence','Last simulation','Next step'],r=>[r.name,r.area,r.status,r.cadence,r.last,r.next]),
  services:()=>table(['Service task','Service','Includes','Status','Owner','Delivery','Next step'],r=>[r.name,r.service,r.detail,r.status,r.owner,r.delivery,r.next]),
};
export function createWorkspaceState() {
  return {active:'accounting',tab:'accounting',density:'compact',targets:createTargetsState(),actionStatuses:createActionStatuses(),removedActions:[],
    queries:Object.fromEntries(TABS.filter(label=>label!=='SETTINGS').map(label=>[label.toLowerCase(),''])),
    options:Object.fromEntries(Object.entries(CONFIG).map(([id,config])=>[id,Object.fromEntries(config.fields.map(f=>[f.key,f.choices[0]]))]))};
}
export function selectWorkspace(state,id) {
  if(!TABS.some(tab=>tab.toLowerCase()===id))return false;
  state.tab=id;if(id!=='settings')state.active=id;return true;
}
export function setWorkspaceQuery(state,id,value) {
  if(['settings','chat'].includes(id)||!TABS.some(tab=>tab.toLowerCase()===id))return false;
  const query=String(value??'');state.queries??={};state.queries[id]=query;
  if(id==='ppc')state.targets.query=query;
  return true;
}
export function setOption(state,id,key,value) {
  const rule=CONFIG[id]?.fields.find(f=>f.key===key);if(!rule?.choices.includes(value))return false;
  state.options[id][key]=value;
  if(id==='ppc'&&key==='view')state.targets.entities=null;
  if(id==='ppc'&&key==='view'&&['Targets','ASINs'].includes(value))state.targets.kind=value==='ASINs'?'ASINs':'All';
  return true;
}
const queryMatches=(row,query)=>!query||row.some(value=>String(value??'').toLowerCase().includes(query));
function totalsFor(headers,rows,sumColumns) {
  return headers.map((_,index)=>{
    const format=sumColumns[index];if(!format)return '';
    const total=rows.reduce((sum,row)=>sum+Number(String(row[index]).replace(/[$,]/g,'')),0);
    return format==='money'?money(Math.round(total*100)/100):total;
  });
}
export function viewFor(state,id=state.active) {
  if(id==='chat')return {kind:'chat',id:'chat'};
  const options=state.options[id];if(!options)return null;
  if(id==='ppc')return targetsView(state.targets,options.status,options.view);
  const query=(state.queries?.[id]||'').trim().toLowerCase();
  if(id==='actions'){
    const filteredActions=mockActionsFor(state),products=[...new Set(filteredActions.map(action=>action.item))];
    const entries=products.map(item=>{
      const slots=ACTION_COLUMN_HEADERS.map((_,slot)=>filteredActions.find(action=>action.item===item&&action.slot===slot)||null);
      return {slots,cells:[item,...slots.map(action=>action?.summary||'')]};
    }).filter(entry=>queryMatches(entry.cells,query));
    const actionSlots=entries.map(entry=>entry.slots),actions=actionSlots.flat().filter(Boolean),headers=['PRODUCT',...ACTION_COLUMN_HEADERS];
    return {id,title:ACTION_BRAND+' · ACTIONS',headers,rows:entries.map(entry=>entry.cells),actions,actionSlots,totals:headers.map(()=>''),toneColumns:{},query:state.queries?.[id]||'',recordCount:entries.length,
      summary:actions.length+' actions · '+options.area+' · '+options.status,notice:ACTION_NOTICE};
  }
  const definition=tables[id](options);
  let selected=records[id].filter(row=>['status','area','service','priority','owner'].every(key=>!options[key]||options[key]==='All'||row[key]===options[key]));
  if(options.order==='Oldest first')selected=[...selected].reverse();
  const rows=selected.map(definition.cells).filter(row=>queryMatches(row,query));
  return {id,title:id==='cases'?'AMAZON CASES':id.toUpperCase(),headers:definition.headers,rows,
    totals:totalsFor(definition.headers,rows,definition.sumColumns),toneColumns:definition.toneColumns,query:state.queries?.[id]||'',recordCount:rows.length,
    summary:rows.length+' records · '+CONFIG[id].fields.map(f=>options[f.key]).join(' · '),
    notice:id==='automation'?'DEMO ONLY · Fictional rules and run history. No rules are running.':id==='services'
      ?'DEMO ONLY · Fictional service tasks. Nothing is booked or connected.':'DEMO ONLY · Fictional sample data. No account connected.'};
}
