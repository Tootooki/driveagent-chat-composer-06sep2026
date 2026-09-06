import {ACTION_COLUMN_HEADERS,ACTION_STATUSES,shortActionText} from './actions-model.mjs?v=76';
export const PPC_ACTION_HEADERS=ACTION_COLUMN_HEADERS;
export function ppcActionExamples(row){
  const addition=row.type==='asin'?'Add a related ASIN target.':row.type==='auto'?'Add a converting term as an exact keyword.':row.type==='category'?'Add a relevant category target.':row.type==='portfolio'?'Add a campaign to this portfolio.':row.type==='campaign'?'Add a proven target to this campaign.':'Add a relevant exact-match keyword.';
  const ideas=[
    ['down','Reduce bid by 10%.','Consider reducing the relevant target bid by 10% after reviewing spend, conversions and the chosen ACoS goal.'],
    ['up',addition,'Review relevance and conversion evidence before adding the proposed target or campaign.'],
    ['up','Raise daily budget by $5.','Consider increasing the associated campaign budget by $5 if profitable traffic is limited by the current budget.'],
    ['down','Reduce low-converting traffic bids by 15%.','Review low-converting traffic and consider reducing the affected bids by 15%.'],
    ['up','Increase a converting target bid by 5%.','Consider raising a converting target bid by 5% after checking its recent volume and profitability.'],
  ];
  return Object.freeze(ideas.map(([direction,summary,detail],slot)=>Object.freeze({
    id:`PPC-${row.id}-${slot+1}`,recordId:row.id,slot,area:'PPC',kind:'Change',item:row.name,sku:row.sku||'',direction,mock:true,
    summary:shortActionText({summary}),todo:`Example action for “${row.name}”${row.campaign?` in ${row.campaign}`:''}. ${summary} ${detail} This is a fictional interface mockup, not a finding about the displayed performance. Nothing is sent to an advertising account.`,
  })));
}
export function createPpcActionState(records){
  const actions=Object.fromEntries(records.flatMap(ppcActionExamples).map(action=>[action.id,action]));
  return {actions,statuses:Object.fromEntries(Object.keys(actions).map(id=>[id,'NEW'])),removed:[]};
}
export function getPpcAction(state,id){const action=Object.hasOwn(state.actions,id)?state.actions[id]:null;return action&&!state.removed.includes(id)?{...action,status:state.statuses[id]}:null;}
export function setPpcActionStatus(state,id,status){if(!getPpcAction(state,id)||!ACTION_STATUSES.includes(status))return false;state.statuses[id]=status;return true;}
export function removePpcAction(state,id){if(!getPpcAction(state,id))return false;state.removed.push(id);return true;}
export function restorePpcAction(state,id){const i=state.removed.indexOf(id);if(i<0)return false;state.removed.splice(i,1);return true;}
