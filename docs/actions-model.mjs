import {ACTION_PRODUCTS} from './action-products.mjs?v=76';
export {ACTION_PRODUCTS};
// Entirely fictional UI examples. Never imported from an account or the report.
export const ACTION_BRAND = 'DOLCE AGENT';
export const ACTION_STATUSES = Object.freeze(['LIVE', 'NEW', 'DONE']);
export const ACTION_NOTICE = 'Example action · Fictional scenario, not a verified finding or completed action. Buttons affect this preview only and reset on refresh; nothing is executed.';
export const ACTION_COLUMN_HEADERS = Object.freeze(['ACTION1','ACTION2','ACTION3','ACTION4','ACTION5']);
export const ACTION_COLORS = Object.freeze({down:'rgb(241, 198, 198)',up:'rgb(183, 223, 207)'});
const summaries = {
  'MOCK-01':'Lower BUTTER200 bid $1.10 → $0.90; ACoS 40%.',
  'MOCK-02':'Raise MINTDUB6 budget $15 → $20; 8/14 days capped.',
  'MOCK-03':'Add “Spread” to CREAM200 title; query CTR 3%.',
  'MOCK-04':'Clarify BLUE2 pack of 2 in the first bullet.',
  'MOCK-05':'Reduce DRIED400 price $12.99 → $11.99.',
  'MOCK-06':'Transfer 24 ROAST5KG cases; stock covers 4 days.',
  'MOCK-07':'Check STRAC6 stock: 48 recorded vs 60 counted.',
  'MOCK-08':'Check MILK200 reimbursement for 12 damaged units.',
  'MOCK-09':'Raise SAUCE700 price $9.99 → $10.49.',
  'MOCK-10':'Approve $96 DRIED180 claim for 12 missing units.',
};
export function shortActionText(action) {
  const text=String(action?.summary || action?.todo || '').replace(/\s+/g,' ').trim();
  const characters=Array.from(text);
  return characters.length>50?characters.slice(0,49).join('')+'…':text;
}
const originalActions = [
  {id:'MOCK-01',area:'PPC',kind:'Change',item:'BUTTER200',todo:'Lower the “pistachio butter” exact-match target bid in the BUTTER200 Exact campaign from $1.10 to $0.90 because it generated $40 in spend and $100 in attributed sales at 40% ACoS against a 30% ceiling during 19 August–1 September 2026.'},
  {id:'MOCK-02',area:'PPC',kind:'Change',item:'MINTDUB6',todo:'Increase the MINTDUB6 Exact campaign daily budget from $15 to $20 because it exhausted its budget on 8 of 14 days while achieving 20% ACoS against a 30% ceiling during 19 August–1 September 2026.'},
  {id:'MOCK-03',area:'SEO',kind:'Change',item:'CREAM200',todo:'Update the CREAM200 title from “Pistachio Cream 200g” to “Pistachio Cream Spread 200g” because the relevant query “pistachio spread” generated 500 impressions and 15 clicks at a 3% click-through rate during 19 August–1 September 2026.'},
  {id:'MOCK-04',area:'SEO',kind:'Change',item:'BLUE2',todo:'Change the BLUE2 first bullet from “Blueberry chocolate bars” to “Pack of 2 blueberry chocolate bars” because 9 of 30 customer questions asked how many bars were included during 3 August–1 September 2026.'},
  {id:'MOCK-05',area:'Pricing',kind:'Change',item:'DRIED400',todo:'Reduce the DRIED400 selling price from $12.99 to $11.99 because the lower price achieved 9% conversion and $2.60 contribution per unit versus 5% conversion at the current price in the price test during 19 August–1 September 2026.'},
  {id:'MOCK-06',area:'Stock',kind:'Change',item:'ROAST5KG',todo:'Increase the planned ROAST5KG warehouse transfer from 0 to 24 cases because the 1 September 2026 stock count showed 12 cases available, covering only 4 days at the average sales rate of 3 cases per day during 19 August–1 September 2026.'},
  {id:'MOCK-07',area:'Stock',kind:'Check',item:'STRAC6',todo:'Check the STRAC6 inventory discrepancy without changing stock records because the system recorded 48 units and the physical count recorded 60 units, leaving a 12-unit difference in the 1 September 2026 inventory audit.'},
  {id:'MOCK-08',area:'Reimbursement',kind:'Check',item:'MILK200',todo:'Check reimbursement eligibility for 12 damaged MILK200 units without submitting a claim because the inbound report recorded 120 units received, 108 sellable units and 12 damaged units with no reimbursement during 19 August–1 September 2026.'},
  {id:'MOCK-09',area:'Pricing',kind:'Approval',item:'SAUCE700',todo:'Approve the proposed SAUCE700 selling price increase from $9.99 to $10.49 without applying it because the product sold 200 units at $2.00 contribution per unit against a $2.50 target during 19 August–1 September 2026.'},
  {id:'MOCK-10',area:'Reimbursement',kind:'Approval',item:'DRIED180',todo:'Approve submission of a $96 reimbursement claim for 12 missing DRIED180 units valued at $8 each without submitting it because shipment records showed 120 units delivered and 108 units checked in during 19 August–1 September 2026.'},
];

function productActions(product) {
  const {item,sku,keyword,sourceRowIndex}=product;
  const original=originalActions.find(action=>action.item===item);
  const actions=[
    original?{...original,summary:summaries[original.id],direction:['MOCK-01','MOCK-05'].includes(original.id)?'down':'up'}:{
      area:'PPC',kind:'Change',direction:'down',summary:`Reduce ${item} exact bid by 15%.`,
      todo:`For ${item}, reduce the exact-match target bid by 15% in this example when its ACoS exceeds the chosen target; confirm recent spend, attributed sales and conversion volume before making a real change.`,
    },
    {
      area:'PPC',kind:'Change',direction:'up',summary:`Add keyword: “${keyword}”.`,
      todo:`For ${item}, add “${keyword}” as an exact-match keyword in the relevant campaign in this example; first confirm that the search term is relevant to this specific product and has profitable conversions before choosing a bid.`,
    },
    {
      area:'PPC',kind:'Change',direction:'up',summary:`Raise ${item} daily budget by $5.`,
      todo:`For ${item}, increase the campaign daily budget by $5 in this example when a profitable campaign runs out of budget; check recent budget utilization and ACoS, then monitor the effect on spend and sales.`,
    },
    {
      area:'PPC',kind:'Change',direction:'down',summary:`Reduce ${item} broad bid by 10%.`,
      todo:`For ${item}, reduce the broad-match target bid by 10% in this example when broad traffic spends above the chosen ACoS target; inspect the search-term report and keep productive exact-match targets unchanged.`,
    },
    {
      area:'SEO',kind:'Change',direction:'up',summary:`Add ${item} pack-size image.`,
      todo:`For ${item}, add a secondary product image showing the actual package contents, quantity and size in this example; verify this exact SKU’s packaging and keep the main image compliant with the marketplace requirements.`,
    },
  ];
  return actions.map((action,slot)=>Object.freeze({id:`EXAMPLE-${sourceRowIndex}-${slot+1}`,...action,item,sku,slot,mock:true}));
}
export const MOCK_ACTIONS=Object.freeze(ACTION_PRODUCTS.flatMap(productActions));
// Use the original SKU so duplicate-looking product variants never share actions.
export const ACTION_SKUS=Object.freeze(Object.fromEntries(ACTION_PRODUCTS.map(product=>[
  product.sku,Object.freeze(MOCK_ACTIONS.filter(action=>action.sku===product.sku).map(action=>action.id)),
])));

export const createActionStatuses = () => Object.fromEntries(MOCK_ACTIONS.map(action=>[action.id,'NEW']));
export function setMockActionStatus(state,id,status) {
  if(!MOCK_ACTIONS.some(action=>action.id===id)||!ACTION_STATUSES.includes(status))return false;
  state.actionStatuses[id]=status;return true;
}
export function mockActionsFor(state) {
  const options=state.options.actions;
  return MOCK_ACTIONS.filter(action=>!state.removedActions.includes(action.id)).map(action=>({...action,status:state.actionStatuses[action.id]}))
    .filter(action=>(options.area==='All'||action.area===options.area)&&(options.status==='All'||action.status===options.status));
}

export function removeMockAction(state,id) {
  if(!MOCK_ACTIONS.some(action=>action.id===id)||state.removedActions.includes(id))return false;
  state.removedActions.push(id);return true;
}
export function restoreMockAction(state,id) {
  const index=state.removedActions.indexOf(id);if(index<0)return false;
  state.removedActions.splice(index,1);return true;
}
