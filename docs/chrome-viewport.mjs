// Chrome/iOS can pan the visual viewport without changing document scrollTop.
// Compensate the app frame, never transform the body or reset inner scroll areas.
export function chromeViewportFrame({viewport, bodyTop = 0, scrollY = 0, layoutWidth = null}) {
  if (!viewport || !Number.isFinite(viewport.height) || viewport.height <= 0 ||
      !Number.isFinite(viewport.width) || viewport.width <= 0) return null;
  if (Number.isFinite(layoutWidth) && Math.abs(viewport.width-layoutWidth) > Math.max(2,layoutWidth*.02)) return null;
  const scale = viewport.scale ?? 1;
  // Do not undo pinch zoom or reflow the app while the user magnifies it.
  if (!Number.isFinite(scale) || Math.abs(scale - 1) > .02) return null;
  const positive = n => Number.isFinite(n) ? Math.max(0, n) : 0;
  // These are alternative observations of the same document-space origin,
  // not offsets to add. pageTop covers the reported under-counted offsetTop.
  const top = Math.max(positive(viewport.pageTop),
    positive(viewport.offsetTop) + positive(scrollY), positive(-bodyTop));
  const height = viewport.height;
  return {top, height, extent: top + height};
}

export function installChromeViewport({win = window, doc = document,
  eligible = /CriOS\//.test(win.navigator?.userAgent || '')} = {}) {
  if (!eligible || !win.visualViewport) return () => {};
  const root = doc.documentElement, viewport = win.visualViewport;
  const media = win.matchMedia('(max-width: 899px)');
  let frame = 0, retryFrame = 0, baseline = 0, keyboardSession = false;
  let lastWidth = 0, lastHeight = 0, lastTop = 0;
  const timers = new Set();
  const props = ['--chrome-app-top','--chrome-app-height','--chrome-page-height'];
  function clear() {
    const active=root.hasAttribute('data-chrome-viewport');
    root.removeAttribute('data-chrome-viewport');root.removeAttribute('data-chrome-keyboard');
    props.forEach(p => root.style.removeProperty(p));
    baseline = 0;keyboardSession = false;lastHeight = 0;lastTop = 0;
    if(active)win.dispatchEvent(new win.Event('dolce:viewportchange'));
  }
  function apply() {
    if (doc.visibilityState === 'hidden') return;
    if (!media.matches) { clear();return; }
    if (!doc.body) return;
    const active = doc.activeElement;
    const editing = Boolean(active?.isContentEditable || active?.matches?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'));
    const next = chromeViewportFrame({viewport, bodyTop: doc.body.getBoundingClientRect().top, scrollY: win.scrollY, layoutWidth:win.innerWidth});
    if (!next) return;
    const width = viewport.width;
    if (lastWidth && Math.abs(lastWidth - width) > 40) {baseline=0;keyboardSession=false;}
    lastWidth=width;
    // A newly restored tab may briefly retain another keyboard's small height.
    // Without an editing session, reject that large shrink but still fix a measured pan.
    if (!editing && !keyboardSession && Number.isFinite(win.innerHeight) &&
      win.innerHeight-next.height>Math.max(160,win.innerHeight*.3)) {
      next.height=win.innerHeight;next.extent=next.top+next.height;
    }
    if (!baseline) baseline = Math.max(next.height, Number.isFinite(win.innerHeight) ? win.innerHeight : next.height);
    if (!editing && !keyboardSession) baseline=Math.max(baseline,next.height);
    const reduced = baseline - next.height > 100;
    keyboardSession = reduced && (editing || keyboardSession);
    const keyboardChanged=root.getAttribute('data-chrome-keyboard')!==String(keyboardSession);
    root.setAttribute('data-chrome-keyboard',String(keyboardSession));
    const changed = keyboardChanged || !root.hasAttribute('data-chrome-viewport') || Math.abs(lastHeight-next.height)>.25 || Math.abs(lastTop-next.top)>.25;
    if (!changed) return;
    root.style.setProperty(props[0],next.top+'px');
    root.style.setProperty(props[1],next.height+'px');
    root.style.setProperty(props[2],next.extent+'px');
    root.setAttribute('data-chrome-viewport','true');
    lastHeight=next.height;lastTop=next.top;
    win.dispatchEvent(new win.Event('dolce:viewportchange'));
  }
  function schedule() {
    if (frame || doc.visibilityState === 'hidden') return;
    frame=win.requestAnimationFrame(()=>{frame=0;apply();
      // Some iOS events precede their updated viewport sample by one frame.
      if (!retryFrame) retryFrame=win.requestAnimationFrame(()=>{retryFrame=0;apply();});
    });
  }
  function cancelTimers() {timers.forEach(id=>win.clearTimeout(id));timers.clear();}
  function settle() {
    cancelTimers();schedule();
    if (doc.visibilityState==='hidden') return;
    for (const delay of [100,400,1000]) {
      const id=win.setTimeout(()=>{timers.delete(id);schedule();},delay);timers.add(id);
    }
  }
  const events=[];
  const on=(target,type,fn)=>{target.addEventListener(type,fn,{passive:true});events.push([target,type,fn]);};
  on(viewport,'resize',schedule);on(viewport,'scroll',schedule);on(viewport,'scrollend',schedule);
  on(win,'resize',schedule);on(win,'scroll',schedule);on(win,'pageshow',settle);
  on(win,'orientationchange',settle);on(win,'pagehide',cancelTimers);
  on(doc,'visibilitychange',settle);on(doc,'focusin',settle);on(doc,'focusout',settle);
  on(doc,'DOMContentLoaded',settle);on(media,'change',settle);
  apply();settle();
  return ()=>{events.forEach(([target,type,fn])=>target.removeEventListener(type,fn));cancelTimers();
    if(frame)win.cancelAnimationFrame(frame);if(retryFrame)win.cancelAnimationFrame(retryFrame);clear();};
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') installChromeViewport();
