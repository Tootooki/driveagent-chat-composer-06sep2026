// Fit only an active chat keyboard session. Stale startup viewport values may
// not move the page or shrink a chat that has never opened a keyboard.
export function chatViewportInsets({shell, viewport, typing = false, wasKeyboard = false}) {
  const valid = viewport && Number.isFinite(viewport.height) && viewport.height > 0;
  const visibleTop = valid && Number.isFinite(viewport.offsetTop) ? Math.max(0, viewport.offsetTop) : 0;
  const visibleBottom = visibleTop + (valid ? viewport.height : shell.height);
  const visibleHeight = Math.max(0, Math.min(shell.bottom, visibleBottom) - Math.max(shell.top, visibleTop));
  const keyboard = Boolean(valid && (typing || wasKeyboard) && shell.height - visibleHeight > 100);
  return {
    keyboard,
    top: keyboard ? Math.max(0, visibleTop - shell.top + 6) : 0,
    bottom: keyboard ? Math.max(0, shell.bottom - visibleBottom + 6) : 0,
    short: (keyboard ? visibleHeight : shell.height) < 420,
  };
}
