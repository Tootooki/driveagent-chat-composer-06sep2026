// The white data apertures are bounded by independently moving sticky cells.
// Work in scrollport coordinates, not original spreadsheet row numbers.
export function frameGeometry({viewport, headerTop, headerRight, headerBottom, frozenRight, sections, scale = 1}) {
  const windows = [], cutouts = [];
  // Same radius as the semantic red/green cells, in the same sheet scale.
  const baseRadius = 3 * Math.max(0.02, Number(scale) || 1);
  sections.forEach((section, index) => {
    const left = Math.max(viewport.left, frozenRight, section.left);
    const right = Math.min(viewport.right, section.right);
    const top = Math.max(viewport.top, headerBottom, section.totalBottom, section.top);
    const bottom = section.bottom;
    const meetsFooter = bottom >= viewport.bottom - 1;
    const windowBottom = meetsFooter ? viewport.bottom - 1 : bottom;
    if (right > left && windowBottom > top && top < viewport.bottom && bottom > viewport.top) {
      windows.push({
        x: left - viewport.left, y: top - viewport.top,
        width: right - left, height: windowBottom - top,
        radius: Math.min(baseRadius, (right - left) / 2, (windowBottom - top) / 2),
        // The requested native 1px footer also closes an aperture that continues
        // below the screen. Its inner corners meet that fixed black edge.
        bottomCorners: meetsFooter || index < sections.length - 1,
        rightCorners: section.right >= viewport.right - 0.5,
      });
    }
    if (index === sections.length - 1 && bottom > top && bottom < viewport.bottom - 1) {
      const blackRight = Math.min(viewport.right, left);
      const width = blackRight - viewport.left;
      const radius = Math.min(baseRadius, width / 2, (bottom - top) / 2);
      if (width > 0 && radius > 0) cutouts.push({
        x: 0, y: bottom - viewport.top - radius,
        width, height: radius, radius,
      });
    }
  });
  // When fit-to-width leaves white space on the right, that is an exposed
  // OUTER black edge. Round inward there instead of adding a concave black cap.
  // Merge touching/sticky header bands so shared seams never get rounded.
  const bands = [{top: headerTop, bottom: headerBottom, right: headerRight},
    ...sections.map(s => ({top: s.totalTop, bottom: s.totalBottom, right: s.right}))]
    .filter(b => Number.isFinite(b.top) && Number.isFinite(b.right) && b.right > viewport.left && b.right < viewport.right - 0.5)
    .sort((a, b) => a.top - b.top);
  const joined = [];
  for (const band of bands) {
    const previous = joined.at(-1);
    if (previous && band.top <= previous.bottom + 0.5 && Math.abs(band.right - previous.right) < 0.5) {
      previous.bottom = Math.max(previous.bottom, band.bottom);
    } else joined.push({...band});
  }
  for (const band of joined) {
    const height = band.bottom - band.top;
    if (height <= 0 || band.bottom <= viewport.top || band.top >= viewport.bottom) continue;
    const radius = Math.min(baseRadius, height / 2, (band.right - viewport.left) / 2);
    cutouts.push({x: band.right - viewport.left - radius, y: band.top - viewport.top,
      width: radius, height, radius, leftCorners: false,
      topCorners: band.top >= viewport.top, bottomCorners: band.bottom <= viewport.bottom});
  }
  return {windows, cutouts};
}

// Only the little regions outside each quarter-circle are painted. There is
// no border, full-surface paint or clipping of individual black cells.
export function cornerPath(width, height, radius, {top = true, bottom = true, left = true, right = true} = {}) {
  const w = width, h = height, r = radius;
  if (!(w > 0 && h > 0 && r > 0)) return '';
  return [
    top && left ? `M0 ${r}V0H${r}A${r} ${r} 0 0 0 0 ${r}Z` : '',
    top && right ? `M${w-r} 0H${w}V${r}A${r} ${r} 0 0 0 ${w-r} 0Z` : '',
    bottom && right ? `M${w} ${h-r}V${h}H${w-r}A${r} ${r} 0 0 0 ${w} ${h-r}Z` : '',
    bottom && left ? `M${r} ${h}H0V${h-r}A${r} ${r} 0 0 0 ${r} ${h}Z` : '',
  ].join('');
}
