// These are the dates in the saved report, not rolling windows relative to today.
export const ACCOUNTING_PERIOD_DATES=Object.freeze(Object.fromEntries(Object.entries({
  all:{start:'2025-06-10',end:'2026-09-03'},
  '1d':{start:'2026-09-03',end:'2026-09-03'},
  range:{start:'2026-06-07',end:'2026-06-09'},
  '7d':{start:'2026-06-03',end:'2026-06-09'},
  '30d':{start:'2026-05-11',end:'2026-06-09'},
  '60d':{start:'2026-04-11',end:'2026-06-09'},
  '90d':{start:'2026-03-12',end:'2026-06-09'},
  '180d':{start:'2025-12-12',end:'2026-06-09'},
  '365d':{start:'2025-06-10',end:'2026-06-09'},
}).map(([key,value])=>[key,Object.freeze(value)])));

const DAY=86400000;
function dateTime(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number),date=new Date(0);
  // setUTCFullYear avoids Date.UTC's special treatment of years 00 through 99.
  date.setUTCFullYear(year,month-1,day);date.setUTCHours(0,0,0,0);
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date.getTime():null;
}

export function accountingDateRangeError(start,end){
  if(dateTime(start)===null||dateTime(end)===null)return 'Choose both a valid start date and end date.';
  if(start>end)return 'The start date must be on or before the end date.';
  const bounds=ACCOUNTING_PERIOD_DATES.all;
  if(start<bounds.start||end>bounds.end)return `Choose dates from ${bounds.start} to ${bounds.end}.`;
  return '';
}

export function accountingSavedPeriod(start,end){
  if(accountingDateRangeError(start,end))return null;
  return Object.entries(ACCOUNTING_PERIOD_DATES).find(([key,dates])=>key!=='all'&&dates.start===start&&dates.end===end)?.[0]||null;
}

const TOTAL_KEYS={PISTACHIO:'PISTACHIO_TOTALS',KATAIFI:'KATAIFI_TOTALS',CHOCO:'CHOCO_TOTALS'};
const ADDITIVE=[7,8,9,14,15,18,19,20,21,22,23];
const COUNT_COLUMNS=new Set([9,14]);
const numberFormat=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const moneyFormat=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});

function reportRows(report){
  if(!Array.isArray(report.rows))return null;
  const rows=new Map();
  for(const raw of report.rows){
    if(!Array.isArray(raw)||raw.length!==24)return null;
    if(raw[1]==='SKU')continue;
    const key=TOTAL_KEYS[raw[0]]||String(raw[1]??'').trim();
    if(!key)continue;
    if(rows.has(key))return null;
    rows.set(key,raw.map(value=>value==null?'':String(value)));
  }
  return rows.size?rows:null;
}

function numeric(value){
  const raw=String(value??'').trim();
  if(!raw)return null;
  const parentheses=/^\(.*\)$/.test(raw);
  const body=(parentheses?raw.slice(1,-1):raw).replace(/\s/g,'');
  if(!/^[+-]?\$?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(body))return NaN;
  const valueNumber=Number(body.replace(/[,$]/g,''));
  return Number.isFinite(valueNumber)?(parentheses?-Math.abs(valueNumber):valueNumber):NaN;
}

function sumColumn(rows,column){
  let sum=0,hasValue=false;
  for(const row of rows){
    const value=numeric(row[column]);
    if(value===null)continue; // Empty activity cells stay empty if every day is empty.
    if(!Number.isFinite(value))return null;
    // Currency is summed in cents to avoid accumulated binary rounding errors.
    const scaled=COUNT_COLUMNS.has(column)?value:Math.sign(value)*Math.round((Math.abs(value)+Number.EPSILON)*100);
    sum+=scaled;hasValue=true;
    if(!Number.isFinite(sum)||Math.abs(sum)>Number.MAX_SAFE_INTEGER)return null;
  }
  return hasValue?(COUNT_COLUMNS.has(column)?sum:sum/100):null;
}

/**
 * Return {rows: Map<source SKU or category total key, string[24]>, partialMetrics}
 * only when every inclusive date has a daily report. The all-period envelope
 * does not imply that independent daily data exists throughout that envelope.
 * Single days retain every source value; longer ranges omit unavailable rates.
 */
export function aggregateAccountingDays(reports,start,end){
  if(accountingDateRangeError(start,end)||!Array.isArray(reports))return null;
  const byDate=new Map();
  for(const report of reports){
    if(!report||dateTime(report.endDate)===null||report.endDate<start||report.endDate>end)continue;
    if(byDate.has(report.endDate))return null;
    const rows=reportRows(report);if(!rows)return null;
    byDate.set(report.endDate,rows);
  }
  const days=[];
  for(let time=dateTime(start);time<=dateTime(end);time+=DAY){
    const rows=byDate.get(new Date(time).toISOString().slice(0,10));
    if(!rows)return null;
    days.push(rows);
  }
  if(days.length===1)return {rows:days[0],partialMetrics:false};

  const result=new Map(),keys=new Set(days.flatMap(rows=>[...rows.keys()]));
  for(const key of keys){
    const last=days.at(-1).get(key),values=Array(24).fill('');
    if(last)values.splice(0,6,...last.slice(0,6));
    else if(!key.endsWith('_TOTALS'))values[1]=key;
    const source=days.map(rows=>rows.get(key));
    // A missing product row is incomplete coverage, not zero activity.
    if(source.every(Boolean)){
      const sums=new Map(ADDITIVE.map(column=>[column,sumColumn(source,column)]));
      for(const [column,value] of sums){
        if(value!==null)values[column]=COUNT_COLUMNS.has(column)?numberFormat.format(value):moneyFormat.format(value);
      }
      const sales=sums.get(7),ads=sums.get(8);
      if(sales!==null&&sales>0&&ads!==null){
        const tacos=Math.abs(ads)/sales*100;
        if(Number.isFinite(tacos))values[13]=tacos.toFixed(2)+'%';
      }
    }
    result.set(key,values);
  }
  return {rows:result,partialMetrics:true};
}
