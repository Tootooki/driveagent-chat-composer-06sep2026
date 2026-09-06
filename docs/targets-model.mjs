import {PPC_ACTION_HEADERS,ppcActionExamples} from './ppc-actions-model.mjs?v=84';
// Illustrative records for a structural preview, never imported account performance.
export const TARGET_REFERENCE='https://docs.google.com/spreadsheets/d/15GDQmpzYvHnZvdnSwH6NNLYuSGUCZmigYev3gntKoSQ/edit#gid=1233007547';
export const TARGET_PERIODS=Object.freeze(['1D','7D','30D','60D','90D','365D','ALL']);
export const TARGET_KINDS=Object.freeze(['All','Keywords','ASINs','Auto','Categories']);
export const TARGET_FILTERS=Object.freeze({entities:['Campaigns','ASINs','Keywords','Auto','Categories'],adTypes:['SP','SB','SD'],matchTypes:['EXACT','BROAD','PHRASE','EXPANDED'],placements:['TOS']});
export const AUTO_TARGETS=Object.freeze(['Auto Close','Auto Loose','Auto Substitutes','Auto Complements']);
export const TARGET_DATE_END='2026-09-05';
export const TARGET_DATE_START='2025-09-06';
export const TARGET_METRICS=Object.freeze([
  {key:'spend',label:'SPEND',format:'money'}, {key:'sales',label:'SALES',format:'money'},
  {key:'orders',label:'ORDERS',format:'integer'}, {key:'clicks',label:'CLICKS',format:'integer'},
  {key:'acos',label:'ACOS',format:'percent'}, {key:'tacos',label:'TACOS',format:'percent'},
  {key:'cpc',label:'CPC',format:'money'}, {key:'cvr',label:'CVR',format:'percent'},
  {key:'ctr',label:'CTR',format:'percent'}, {key:'impressions',label:'IMPRESSIONS',format:'integer'},
]);
export const TARGET_RECORD_TYPES=Object.freeze({total:'TOTAL',portfolio:'PORTFOLIO',campaign:'CAMPAIGN',group:'AD_GROUP',keyword:'KEYWORD',asin:'KEYWORD_ASIN',term:'SEARCH_TERM_KW',asinTerm:'SEARCH_TERM_ASIN',auto:'AUTO_TARGET',autoTerm:'SEARCH_TERM_AUTO',category:'CATEGORY_TARGET',categoryTerm:'SEARCH_TERM_ASIN'});
export const TARGET_TYPE_COLORS=Object.freeze({keyword:'#8fc9ff',asin:'#d1afff',auto:'#ffd782',category:'#a6e0bb',campaign:'#ffa9a2',portfolio:'#8de1df',total:'#ffffff'});
// Pick the black or white ink with the higher contrast against a six-digit type color.
export function targetInfoForeground(color){
  const [r,g,b]=color.slice(1).match(/../g).map(hex=>{
    const channel=Number.parseInt(hex,16)/255;
    return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
  });
  const luminance=.2126*r+.7152*g+.0722*b;
  return (luminance+.05)/.05>=1.05/(luminance+.05)?'#000000':'#ffffff';
}
export const TARGET_COLORS=Object.freeze({positive:'rgb(183, 223, 207)',negative:'rgb(241, 198, 198)'});
const day=86400000;
const targetMoney=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const targetInteger=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const iso=time=>new Date(time).toISOString().slice(0,10);
const daysBefore=(date,count)=>iso(Date.parse(date+'T00:00:00Z')-count*day);
const fixtureProducts=[
  {key:'pistachio',name:'PISTACHIO',sku:'Pistachio-Cream-200g-New2',item:'CREAM200',budget:100,price:9.49,keywords:[['pistachio cream','pistachio spread'],['pistachio cream 200g','pistachio cream spread']]},
  {key:'kataifi',name:'KATAIFI',sku:'Roasted-Kataifi-400g',item:'ROAST400',budget:100,price:13.99,keywords:[['Kataifi in a glass jar with moss','kataifi pastry'],['roasted kataifi 400g','kataifi for dubai chocolate']]},
  {key:'chocolate',name:'CHOCOLATE',sku:'Choco-Milk-200g',item:'MILK200',budget:100,price:9.59,keywords:[['milk chocolate','chocolate gift'],['milk chocolate 200g','chocolate bar gift']]},
];
let leafIndex=0;
function dailyExample(seed,price){
  return Array.from({length:365},(_,dayIndex)=>{
    // Keep the existing last 60 days unchanged while adding earlier example history.
    const index=dayIndex>=305?dayIndex-305:dayIndex+60;
    const clicks=2+(seed*3+index*7)%15, orders=(seed+index)%4===0?0:Math.floor(clicks/(4+seed%5));
    const cpcCents=22+(seed*17+index*3)%115;
    return Object.freeze({date:daysBefore(TARGET_DATE_END,364-dayIndex),clicks,orders,
      impressions:clicks*(30+(seed+index)%60),spendCents:clicks*cpcCents,salesCents:orders*Math.round(price*100)});
  });
}
function buildCampaign(product,p){
  const campaign=`${product.name}_SP_MANUAL`,campaignId=`${product.key}-campaign`;
  const groups=['BROAD','EXACT','ASIN','PHRASE'].map((match,g)=>{
    const id=`${product.key}-${match.toLowerCase()}`,groupName=`${product.item}_${match}`;
    const children=Array.from({length:2},(_,k)=>{
      const isAsin=match==='ASIN',name=isAsin?(p===1&&k===0?'ASIN777888889':`B0EXAMP${String(p*2+k+1).padStart(3,'0')}`):product.keywords[match==='EXACT'?1:0][k];
      const targetId=`${id}-target-${k+1}`,bid=.65+p*.1+k*.15;
      const status=p===2&&g===0&&k===1?'Paused':'Active';
      const context={campaign,group:groupName,sku:product.sku,item:product.item,adType:'SP',
        portfolio:product.name,match:isAsin?'PRODUCT':match,expandedTarget:isAsin&&k===0,status,target:name,targetKind:isAsin?'ASINs':'Keywords',bid,budget:product.budget,targetAcos:.3};
      const terms=(isAsin?[name]:match==='EXACT'?[name,`${name} buy`]:match==='PHRASE'?[`${name} online`,`${name} shop`]:[`${name} for baking`,`${name} gift`]).map((term,t)=>({
        ...context,id:`${targetId}-term-${t+1}`,type:isAsin?'asinTerm':'term',name:term,children:[],daily:dailyExample(++leafIndex,product.price),
      }));
      return {...context,id:targetId,type:isAsin?'asin':'keyword',name,children:terms};
    });
    return {id,type:'group',name:groupName,campaign,group:groupName,sku:product.sku,item:product.item,
      portfolio:product.name,adType:'SP',match:match==='ASIN'?'PRODUCT':match,status:'Active',bid:.75,budget:product.budget,targetAcos:.3,children};
  });
  if(p===1){
    const context={campaign,group:'ROAST400_CATEGORY',sku:product.sku,item:product.item,portfolio:product.name,adType:'SP',
      status:'Active',budget:product.budget,targetAcos:.3,match:'CATEGORY',bid:.7,target:'Category: Baking ingredients',targetKind:'Categories'};
    const children=['B0EXAMP701','B0EXAMP702'].map((name,i)=>({...context,id:`kataifi-category-term-${i+1}`,type:'categoryTerm',name,children:[],daily:dailyExample(++leafIndex,product.price)}));
    groups.push({...context,id:'kataifi-category-group',type:'group',name:context.group,children:[{...context,id:'kataifi-category-target',type:'category',name:context.target,children}]});
  }
  return {id:campaignId,type:'campaign',name:campaign,campaign,group:'',sku:product.sku,item:product.item,
    portfolio:product.name,adType:'SP',status:'Active',budget:product.budget,targetAcos:.3,children:groups};
}
function buildAutoCampaign(){
  const product=fixtureProducts[1],campaign='KATAIFI_SP_AUTO',group='ROAST400_AUTO';
  const base={campaign,group,sku:product.sku,item:product.item,portfolio:product.name,adType:'SP',status:'Active',budget:100,targetAcos:.3,match:'AUTO',targetKind:'Auto'};
  const examples=[['roasted kataifi 400g','toasted kataifi pastry'],['dubai chocolate ingredients','crispy dessert topping'],['B0EXAMP801','B0EXAMP802'],['B0EXAMP901','B0EXAMP902']];
  const children=AUTO_TARGETS.map((name,i)=>{
    const id=`kataifi-auto-target-${i+1}`,context={...base,target:name,bid:.5+i*.1};
    return {...context,id,type:'auto',name,children:examples[i].map((term,t)=>({...context,id:`${id}-term-${t+1}`,type:'autoTerm',name:term,children:[],daily:dailyExample(++leafIndex,product.price)}))};
  });
  return {...base,id:'kataifi-auto-campaign',type:'campaign',name:campaign,group:'',children:[{...base,id:'kataifi-auto-group',type:'group',name:group,children}]};
}
// Placement and expanded-target flags are illustrative metadata; performance stays unchanged.
let placementIndex=0;
const freezeTree=node=>Object.freeze({...node,children:Object.freeze(node.children.map(freezeTree)),...(node.daily?{daily:Object.freeze(node.daily),placement:['TOS','ROS','PRODUCT_PAGES'][placementIndex++%3]}:{})});
export const TARGET_TREE=Object.freeze([...fixtureProducts.map(buildCampaign),buildAutoCampaign()].map(freezeTree));
export const flattenTargets=(tree=TARGET_TREE)=>tree.flatMap(node=>[node,...flattenTargets(node.children)]);
export const TARGET_NODES=Object.freeze(flattenTargets());
export const createTargetsState=()=>({kind:'All',adType:'All',entities:null,adTypes:null,matchTypes:[],placements:[],period:'30D',query:'',targetWidthRatio:null,rangeStart:daysBefore(TARGET_DATE_END,29),rangeEnd:TARGET_DATE_END});
export function selectedTargetFilters(state,group,view='Targets'){
  if(Array.isArray(state[group]))return state[group];
  if(group==='entities')return view==='Campaigns'?['Campaigns']:state.kind&&state.kind!=='All'?[state.kind]:[];
  if(group==='adTypes')return state.adType&&state.adType!=='All'?[state.adType]:[];
  return [];
}
export function toggleTargetFilter(state,group,value,view='Targets'){
  if(!TARGET_FILTERS[group]?.includes(value))return false;
  const selected=selectedTargetFilters(state,group,view);
  state[group]=selected.includes(value)?selected.filter(item=>item!==value):[...selected,value];
  if(group==='entities')state.kind='All';
  if(group==='adTypes')state.adType='All';
  return true;
}
export const targetMatchLabel=row=>row.targetKind==='ASINs'?(row.expandedTarget?'EXPANDED':'EXACT'):(row.match||'');
export const targetLabel=row=>row.target&&row.type!=='group'&&row.type!=='campaign'?row.target:row.name;
export function targetDateRangeError(start,end){
  const valid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&iso(Date.parse(value+'T00:00:00Z'))===value;
  if(!valid(start)||!valid(end))return 'Choose both a valid From date and To date.';
  if(start>end)return 'From must be on or before To.';
  if(start<TARGET_DATE_START||end>TARGET_DATE_END)return `Choose dates from ${TARGET_DATE_START} to ${TARGET_DATE_END}.`;
  return '';
}
export function setTargetDateRange(state,start,end){
  if(targetDateRangeError(start,end))return false;
  Object.assign(state,{period:'RANGE',rangeStart:start,rangeEnd:end});return true;
}
export function setTargetPeriod(state,key){
  if(key==='RANGE'){
    const current=targetPeriods(state)[0];return setTargetDateRange(state,current.start,current.end);
  }
  if(!TARGET_PERIODS.includes(key))return false;
  state.period=key;const current=targetPeriods(state)[0];
  state.rangeStart=current.start;state.rangeEnd=current.end;return true;
}
export function targetPeriods(state){
  const custom=state.period==='RANGE'&&!targetDateRangeError(state.rangeStart,state.rangeEnd);
  const key=custom?'RANGE':TARGET_PERIODS.includes(state.period)?state.period:'30D';
  const start=custom?state.rangeStart:key==='ALL'?TARGET_DATE_START:daysBefore(TARGET_DATE_END,Number.parseInt(key)-1);
  const end=custom?state.rangeEnd:TARGET_DATE_END;
  return [{key,start,end,label:`${key==='RANGE'?'RANGE':key==='ALL'?'ALL HISTORY':`${Number.parseInt(key)} ${key==='1D'?'DAY':'DAYS'}`} · ${start} — ${end}`,
    metrics:TARGET_METRICS.filter(metric=>metric.key!=='tacos'||key==='30D')}];
}
const empty=()=>({spendCents:0,salesCents:0,clicks:0,orders:0,impressions:0});
const sum=(a,b)=>{for(const key of Object.keys(a))a[key]+=b[key];return a;};
export function targetPerformance(node,period){
  const total=node.children.length?node.children.reduce((a,child)=>sum(a,targetPerformance(child,period)),empty())
    :(node.daily||[]).filter(row=>row.date>=period.start&&row.date<=period.end).reduce(sum,empty());
  const ratio=(numerator,denominator)=>denominator?numerator/denominator:null;
  return {...total,spend:total.spendCents/100,sales:total.salesCents/100,
    acos:ratio(total.spendCents,total.salesCents),tacos:null,cpc:ratio(total.spendCents/100,total.clicks),
    cvr:ratio(total.orders,total.clicks),ctr:ratio(total.clicks,total.impressions),roas:ratio(total.salesCents,total.spendCents)};
}
export function targetMetricTone(metric,value,node){
  if(value===null||value===undefined||value===0)return null;
  if(metric.key==='spend')return 'negative';
  if(metric.key==='acos')return value>node.targetAcos?'negative':'positive';
  return ['sales','orders','clicks','impressions','cvr','ctr'].includes(metric.key)?'positive':null;
}
export function formatTargetMetric(metric,value){
  if(value===null||value===undefined||!Number.isFinite(value))return '—';
  return metric.format==='money'?targetMoney.format(value)
    :metric.format==='percent'?`${(value*100).toFixed(1)}%`:targetInteger.format(value);
}
export function filteredTargets(state,status='All'){
  const query=state.query.trim().toLowerCase();
  const entities=selectedTargetFilters(state,'entities'),adTypes=selectedTargetFilters(state,'adTypes'),matches=selectedTargetFilters(state,'matchTypes'),placements=selectedTargetFilters(state,'placements');
  const filter=node=>{
    if(!node.children.length){
      const kind=node.targetKind;
      const text=[node.name,node.target,node.campaign,node.portfolio,node.group,node.sku,node.item,node.match,node.adType].join(' ').toLowerCase();
      return (!entities.length||entities.includes('Campaigns')||entities.includes(kind))
        &&(!adTypes.length||adTypes.includes(node.adType))
        &&(!matches.length||matches.includes(targetMatchLabel(node)))
        &&(!placements.length||placements.includes(node.placement))
        &&(status==='All'||node.status===status)&&(!query||text.includes(query))?node:null;
    }
    const children=node.children.map(filter).filter(Boolean);
    return children.length?{...node,children}:null;
  };
  return TARGET_TREE.map(filter).filter(Boolean);
}
const aggregateStatus=node=>{
  const statuses=new Set(flattenTargets([node]).filter(n=>!n.children.length).map(n=>n.status).filter(Boolean));
  return statuses.size===1?[...statuses][0]:statuses.size?'Mixed':'—';
};
function flatRecords(tree,view,state){
  if(Array.isArray(state.entities)&&view!=='Portfolios'){
    const selected=state.entities,types={keyword:'Keywords',asin:'ASINs',auto:'Auto',category:'Categories',campaign:'Campaigns'};
    return flattenTargets(tree).filter(node=>selected.length?selected.includes(types[node.type]):['keyword','asin','auto','category'].includes(node.type))
      .map(node=>node.type==='campaign'?{...node,status:aggregateStatus(node)}:node);
  }
  if(view==='Campaigns')return tree.map(node=>({...node,status:aggregateStatus(node)}));
  if(view==='Portfolios')return [...new Set(tree.map(n=>n.portfolio))].map(name=>{
    const children=tree.filter(n=>n.portfolio===name);
    const node={id:`portfolio-${name.toLowerCase()}`,type:'portfolio',name,portfolio:name,adType:'SP',
      children,budget:children.reduce((sum,n)=>sum+n.budget,0),targetAcos:.3};
    return {...node,status:aggregateStatus(node)};
  });
  return flattenTargets(tree).filter(node=>['keyword','asin','auto','category'].includes(node.type));
}
export function targetRows(state,status='All',view='Targets'){
  const periods=targetPeriods(state);
  return flatRecords(filteredTargets(state,status),view,state).map(node=>({...node,performance:periods.map(period=>targetPerformance(node,period))}));
}
export function targetsView(state,status='All',view='Targets'){
  const tree=filteredTargets(state,status),targetRecords=targetRows(state,status,view),periods=targetPeriods(state),all=flattenTargets(tree);
  // Aggregate the filtered source only once, independent of the visible entity level.
  const totalNode={id:'filtered-total',type:'total',name:'TOTAL',children:tree,targetAcos:.3};
  const totalRecord={...totalNode,status:aggregateStatus(totalNode),performance:periods.map(period=>targetPerformance(totalNode,period))};
  const identity=view==='Campaigns'?'Campaign':view==='Portfolios'?'Portfolio':'Target';
  const headers=[identity,'Type','Match','Status',...periods.flatMap(period=>period.metrics.map(metric=>`${period.key}_${metric.label}`)), 'Bid','ASIN / SKU','Campaign','Ad group',...PPC_ACTION_HEADERS];
  const actionSlots=targetRecords.map(ppcActionExamples);
  return {id:'ppc',kind:'targets',title:view.toUpperCase(),headers,periods,targetRecords,totalRecord,actionSlots,
    rows:targetRecords.map((row,index)=>[targetLabel(row),TARGET_RECORD_TYPES[row.type],targetMatchLabel(row),row.status,
      ...periods.flatMap((period,i)=>period.metrics.map(metric=>formatTargetMetric(metric,row.performance[i][metric.key]))),
      row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid),row.sku||'—',row.campaign||'—',row.group||'—',...actionSlots[index].map(action=>action.summary)]),
    counts:{campaigns:all.filter(n=>n.type==='campaign').length,groups:all.filter(n=>n.type==='group').length,
      keywords:all.filter(n=>n.type==='keyword').length,asins:all.filter(n=>n.type==='asin').length,auto:all.filter(n=>n.type==='auto').length,categories:all.filter(n=>n.type==='category').length,terms:all.filter(n=>!n.children.length).length},
    summary:`${state.kind} · ${state.period} · ${status}`,notice:'DEMO ONLY · Example performance for the Targets structure. No account changes.'};
}
