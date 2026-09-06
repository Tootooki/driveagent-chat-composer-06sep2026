import {ACCOUNTING_PERIOD_DATES,accountingDateRangeError,accountingSavedPeriod,aggregateAccountingDays} from './accounting-dates.mjs?v=114';

export function createAccountingDates(){
  const dates=document.createElement('div');dates.className='targets-dates accounting-dates';
  dates.setAttribute('role','group');dates.setAttribute('aria-label','Accounting date range');
  const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const displays=new Map();let requestId=0,dailyRequest=null,lastRange=null;
  function paint(input){
    const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(input.value);
    displays.get(input).textContent=parts?`${months[Number(parts[2])-1]} ${Number(parts[3])} ${parts[1]}`:'DATE';
  }
  function field(side){
    const wrap=document.createElement('label');wrap.className='target-date-field';
    const input=document.createElement('input');input.type='date';input.className='target-date-input';input.id=`accounting-date-${side}`;
    input.min=ACCOUNTING_PERIOD_DATES.all.start;input.max=ACCOUNTING_PERIOD_DATES.all.end;input.required=true;
    input.setAttribute('aria-label',`Accounting ${side} date`);input.setAttribute('aria-describedby','accounting-date-error');wrap.htmlFor=input.id;
    const display=document.createElement('span');display.className='target-date-value';display.setAttribute('aria-hidden','true');displays.set(input,display);
    input.addEventListener('input',()=>{requestId++;paint(input);});
    input.addEventListener('change',applyDates);
    input.addEventListener('keydown',event=>{if(!['Tab','Escape','Enter',' '].includes(event.key))wrap.classList.add('is-date-editing');});
    input.addEventListener('blur',()=>wrap.classList.remove('is-date-editing'));
    input.addEventListener('pointerdown',()=>wrap.classList.remove('is-date-editing'));
    wrap.append(input,display);dates.append(wrap);return input;
  }
  const from=field('from'),to=field('to');
  const notice=document.createElement('p');notice.id='accounting-date-error';notice.className='target-date-error';notice.hidden=true;notice.setAttribute('role','status');dates.append(notice);
  function message(text='',invalid=false){
    notice.textContent=text;notice.hidden=!text;
    [from,to].forEach(input=>input.setAttribute('aria-invalid',String(invalid)));
  }
  function preset(period){
    const range=ACCOUNTING_PERIOD_DATES[period];if(!range)return;
    requestId++;lastRange=null;from.value=range.start;to.value=range.end;paint(from);paint(to);message();
  }
  function applyRange(detail){lastRange=detail;document.dispatchEvent(new CustomEvent('dolce:accounting-range',{detail}));}
  async function reports(){
    if(!dailyRequest)dailyRequest=fetch('daily/index.json').then(response=>response.json()).then(index=>Promise.all(index.dates.map(date=>fetch(`daily/${date}.json`).then(response=>response.json())))).catch(error=>{dailyRequest=null;throw error;});
    return dailyRequest;
  }
  async function applyDates(){
    const id=++requestId,start=from.value,end=to.value,error=accountingDateRangeError(start,end);
    paint(from);paint(to);
    if(error){message(`${error} Previous dates still shown.`,true);return;}
    const sourcePeriod=accountingSavedPeriod(start,end);
    if(sourcePeriod){message();applyRange({start,end,sourcePeriod});return;}
    message('Loading dates…');
    try{
      const result=aggregateAccountingDays(await reports(),start,end);if(id!==requestId)return;
      message(!result?'No report available for these dates.':result.partialMetrics?'Some metrics are unavailable for this range.':'');
      applyRange({start,end,rows:result?.rows,unavailable:!result});
    }catch{
      if(id===requestId)message('Could not load this range. Previous dates still shown.');
    }
  }
  document.addEventListener('dolce:accounting-period',event=>preset(event.detail.period));
  document.addEventListener('dolce:accounting-edit-range',()=>{applyDates();from.focus({preventScroll:true});});
  document.addEventListener('dolce:menu-ready',()=>{if(lastRange)applyRange(lastRange);});
  preset(document.querySelector('[data-period][aria-pressed="true"]')?.dataset.period||'1d');return dates;
}
