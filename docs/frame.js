import {frameGeometry, cornerPath} from './frame-geometry.mjs?v=69';

const mount = document.getElementById('sheet');
const shell = mount.closest('.workbook-shell');
const mobile = window.matchMedia('(max-width: 899px)');
const svgNS = 'http://www.w3.org/2000/svg';
const overlay = document.createElementNS(svgNS, 'svg');
overlay.classList.add('sheet-frame-overlay');
overlay.setAttribute('aria-hidden', 'true');
overlay.setAttribute('focusable', 'false');
shell.append(overlay);

let grid = null, header = [], sections = [], scheduled = false;
const pathPool = [];
const setAttribute = (node, name, value) => { if (node.getAttribute(name) !== value) node.setAttribute(name, value); };
const setStyle = (name, value) => { if (overlay.style[name] !== value) overlay.style[name] = value; };
const clear = () => { if (overlay.childElementCount) overlay.replaceChildren(); pathPool.length = 0; };
const resize = new ResizeObserver(() => schedule());
resize.observe(mount);
resize.observe(shell);

function collect() {
  const nextGrid = mount.querySelector('.sheet-grid');
  if (nextGrid !== grid) {
    if (grid) resize.unobserve(grid);
    grid = nextGrid;
    if (grid) resize.observe(grid);
  }
  header = []; sections = [];
  if (!grid) return;
  const columns = Number(grid.getAttribute('aria-colcount'));
  if (columns < 5) return;
  const cells = [...grid.children].filter(cell => cell.classList.contains('sheet-cell'));
  let section;
  for (let offset = 0; offset < cells.length; offset += columns) {
    const row = cells.slice(offset, offset + columns);
    if (row.length !== columns) continue;
    if (row[0].classList.contains('header-cell')) { header = row; continue; }
    if (row[0].classList.contains('total-cell')) {
      section = {total: row[4], first: null, last: null, end: null};
      sections.push(section);
    } else if (section) {
      // IMG, NAME, PRICE and COG always precede BSR, the white area's start.
      section.first ||= row[4];
      section.last = row[4];
      section.end = row.at(-1);
    }
  }
  sections = sections.filter(section => section.first && section.last);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; paint(); });
}

function paint() {
  if (mount.hidden || !mobile.matches || !grid || !header.length || !sections.length) {
    clear(); return;
  }
  const mountBox = mount.getBoundingClientRect(), shellBox = shell.getBoundingClientRect();
  const viewport = {
    left: mountBox.left + mount.clientLeft, top: mountBox.top + mount.clientTop,
    right: mountBox.left + mount.clientLeft + mount.clientWidth,
    bottom: mountBox.top + mount.clientTop + mount.clientHeight,
  };
  const width = mount.clientWidth, height = mount.clientHeight;
  if (!width || !height) { clear(); return; }
  // Complete all layout reads before touching the overlay. Native backing
  // surfaces handle black joins; only these tiny decorative corners need JS.
  const overlayLeft = viewport.left - shellBox.left - shell.clientLeft;
  const overlayTop = viewport.top - shellBox.top - shell.clientTop;
  const frozenRight = Math.max(viewport.left, ...header
    .filter(cell => cell.classList.contains('frozen-cell'))
    .map(cell => cell.getBoundingClientRect().right));
  const headerBox = header[0].getBoundingClientRect();
  const geometry = frameGeometry({
    viewport, frozenRight, headerTop: headerBox.top, headerBottom: headerBox.bottom,
    headerRight: header.at(-1).getBoundingClientRect().right,
    scale: parseFloat(getComputedStyle(grid).getPropertyValue('--sheet-scale')),
    sections: sections.map(section => {
      const first = section.first.getBoundingClientRect(), total = section.total.getBoundingClientRect();
      return {left: first.left, right: section.end.getBoundingClientRect().right,
        top: first.top, bottom: section.last.getBoundingClientRect().bottom,
        totalTop: total.top, totalBottom: total.bottom};
    }),
  });
  setStyle('left', `${overlayLeft}px`);
  setStyle('top', `${overlayTop}px`);
  setStyle('width', `${width}px`);
  setStyle('height', `${height}px`);
  setAttribute(overlay, 'viewBox', `0 0 ${width} ${height}`);
  let count = 0;
  for (const [type, frames] of [['ink', geometry.windows], ['cutout', geometry.cutouts]]) {
    for (const frame of frames) {
      let path = pathPool[count];
      if (!path) { path = document.createElementNS(svgNS, 'path'); pathPool.push(path); overlay.append(path); }
      setAttribute(path, 'class', `frame-${type}`);
      setAttribute(path, 'transform', `translate(${frame.x} ${frame.y})`);
      setAttribute(path, 'd', cornerPath(frame.width, frame.height, frame.radius,
        {top: type === 'ink' || Boolean(frame.topCorners),
          bottom: frame.bottomCorners ?? true,
          left: frame.leftCorners ?? true, right: frame.rightCorners ?? true}));
      count++;
    }
  }
  while (pathPool.length > count) pathPool.pop().remove();
}

const mutations = new MutationObserver(records => {
  // Name freezing changes classes in place, whereas filtering replaces the grid.
  if (records.some(record => record.type === 'childList')) collect();
  schedule();
});
mutations.observe(mount, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']});
mount.addEventListener('scroll', schedule, {passive: true});
window.addEventListener('resize', schedule, {passive: true});
window.addEventListener('dolce:viewportchange', schedule);
window.addEventListener('dolce:workspace-change', schedule);
window.visualViewport?.addEventListener('resize', schedule, {passive: true});
window.visualViewport?.addEventListener('scroll', schedule, {passive: true});
mobile.addEventListener('change', schedule);
window.addEventListener('pageshow', schedule);
collect(); schedule();
