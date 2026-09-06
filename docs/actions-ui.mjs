import {ACTION_NOTICE, shortActionText} from './actions-model.mjs?v=76';

const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
export function createActionsUI({getAction,onStatus,onRemove,onRestore,returnTarget}) {
  const dialog=el('dialog','action-detail');dialog.id='action-detail';dialog.setAttribute('aria-labelledby','action-detail-title');
  dialog.setAttribute('aria-describedby','action-detail-notice');dialog.setAttribute('aria-modal','true');
  const header=el('div','action-detail-header'),title=el('h2','','ACTION');title.id='action-detail-title';
  const close=el('button','action-detail-close','CLOSE');close.type='button';header.append(title,close);
  const content=el('div','action-detail-body');dialog.append(header,content);document.body.append(dialog);
  const notice=el('div','action-feedback');notice.hidden=true;
  const message=el('span');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const undo=el('button','','UNDO'),dismissNotice=el('button','','×');undo.type=dismissNotice.type='button';dismissNotice.setAttribute('aria-label','Dismiss action message');
  notice.append(message,undo,dismissNotice);document.querySelector('.workbook-shell').append(notice);
  let opener=null,undoId=null;
  const finish=()=>{const target=opener?.isConnected?opener:returnTarget();target?.focus({preventScroll:true});opener=null;};
  const dismiss=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');finish();}};
  close.addEventListener('click',dismiss);dialog.addEventListener('close',finish);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();dismiss();return;}
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button')].filter(node=>!node.disabled);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
  });
  function notify(text,id=null){undoId=id;undo.hidden=!id;notice.hidden=false;message.textContent=text;}
  dismissNotice.addEventListener('click',()=>{notice.hidden=true;returnTarget()?.focus({preventScroll:true});});
  undo.addEventListener('click',()=>{if(undoId&&onRestore(undoId)){notify('Action restored.');returnTarget()?.focus({preventScroll:true});}});
  function open(action,button){
    if(!action)return;
    opener=button;title.textContent=`ACTION${action.slot+1} · ${action.item}`;
    const notice=el('p','action-detail-notice',ACTION_NOTICE);notice.id='action-detail-notice';
    const type=el('p','action-detail-type',`${action.area.toUpperCase()} · ${action.kind.toUpperCase()} ONLY`);
    content.replaceChildren(notice,type,el('p','action-detail-todo',action.todo));
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    close.focus({preventScroll:true});
  }
  function actionCell(action){
    const cell=el('div','action-cell-content');
    if(!action){cell.classList.add('action-empty');cell.setAttribute('aria-label','No action');return cell;}
    cell.dataset.actionId=action.id;
    const summary=el('span','action-summary',shortActionText(action));summary.title=action.todo;
    const controls=el('div','action-cell-buttons');controls.setAttribute('role','group');controls.setAttribute('aria-label',`ACTION${action.slot+1} for ${action.item}`);
    for(const kind of ['info','play','trash']){
      const button=el('button','action-circle-button');button.type='button';button.dataset.actionId=action.id;button.dataset.actionButton=kind;
      const actionName=`ACTION${action.slot+1} for ${action.item}`;
      const label=kind==='info'?`View full ${actionName}`:kind==='play'?`Start ${actionName} in preview`:`Remove ${actionName}`;
      button.setAttribute('aria-label',label);button.title=label;
      const image=el('img');image.src=`action-icons/${kind}.svg`;image.alt='';image.width=image.height=32;image.draggable=false;button.append(image);
      if(kind==='info'){button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','action-detail');button.addEventListener('click',()=>open(getAction(action.id),button));}
      if(kind==='play'){
        button.setAttribute('aria-pressed',String(action.status==='LIVE'));button.disabled=action.status==='LIVE';
        if(button.disabled)button.title='Started in this demo';
        button.addEventListener('click',()=>{if(onStatus(action.id,'LIVE'))notify('Action started in this preview.');});
      }
      if(kind==='trash')button.addEventListener('click',()=>{if(onRemove(action.id))notify('Action removed.',action.id);});
      controls.append(button);
    }
    cell.append(summary,controls);return cell;
  }
  return {actionCell,dialog};
}
