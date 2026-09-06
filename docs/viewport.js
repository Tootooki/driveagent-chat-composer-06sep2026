// CSS owns app size. Repair only the outer document offset that iPhone browsers
// can retain while opening/restoring a tab; never copy visualViewport geometry.
(() => {
  const root = document.documentElement;
  const mobile = window.matchMedia('(max-width: 899px)');
  const nativeHeight = Boolean(window.CSS?.supports?.('height', '100dvh'));
  const restoration = window.history?.scrollRestoration;
  const timers = new Set();
  const visible = () => document.visibilityState !== 'hidden';
  const sync = () => {
    if (!visible()) return;
    if (restoration !== undefined) window.history.scrollRestoration = mobile.matches ? 'manual' : restoration;
    const height = mobile.matches && !nativeHeight && Number.isFinite(window.innerHeight) && window.innerHeight > 0
      ? `${window.innerHeight}px` : '';
    if (root.style.getPropertyValue('--legacy-app-height') !== height) {
      if (height) root.style.setProperty('--legacy-app-height', height);
      else root.style.removeProperty('--legacy-app-height');
      window.dispatchEvent(new Event('dolce:viewportchange'));
    }
  };
  const recoverRoot = () => {
    if (!mobile.matches || !visible()) return;
    const active = document.activeElement;
    // Let the browser reveal the keyboard and its focused field naturally.
    if (active?.isContentEditable || active?.matches?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    // Wait for the chat keyboard animation to finish before repairing root scroll.
    if(root.hasAttribute?.('data-chat-keyboard'))return;
    const scrolling = document.scrollingElement || root;
    const body = document.body;
    const displaced = window.scrollX || window.scrollY || scrolling.scrollLeft || scrolling.scrollTop || body?.scrollLeft || body?.scrollTop;
    if (!displaced) return;
    window.scrollTo(0, 0);
    for (const surface of new Set([scrolling, body])) {
      if (!surface) continue;
      if (surface.scrollLeft) surface.scrollLeft = 0;
      if (surface.scrollTop) surface.scrollTop = 0;
    }
    window.dispatchEvent(new Event('dolce:viewportchange'));
  };
  const cancel = () => { timers.forEach(id => window.clearTimeout(id)); timers.clear(); };
  const settle = () => {
    cancel(); sync(); recoverRoot();
    if (!mobile.matches || !visible()) return;
    // Browser navigation/toolbars may finish restoring after pageshow. A bounded
    // retry catches that late offset without touching normal table gestures.
    for (const delay of [100, 400, 1000]) {
      const id = window.setTimeout(() => { timers.delete(id); sync(); recoverRoot(); }, delay);
      timers.add(id);
    }
  };
  window.addEventListener('resize', sync, {passive: true});
  for (const type of ['load', 'pageshow', 'orientationchange']) window.addEventListener(type, settle, {passive: true});
  for (const type of ['DOMContentLoaded', 'visibilitychange', 'focusout']) document.addEventListener(type, settle);
  window.addEventListener('pagehide', cancel);
  window.addEventListener('dolce:chat-keyboard-end', settle);
  mobile.addEventListener('change', settle);
  settle();
})();
