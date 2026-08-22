export const DOT_SIZE = 4
export const DOT_PITCH = 28
// how many dot-lines an image/content edge stays clear of the canvas edge
export const EDGE_SKIP = 2

export function axisMetrics(size) {
  const count = Math.max(1, Math.floor(size / DOT_PITCH))
  const margin = (size - ((count - 1) * DOT_PITCH + DOT_SIZE)) / 2
  return { count, margin }
}

export function contentMargin(viewportSize) {
  return axisMetrics(viewportSize).margin + EDGE_SKIP * DOT_PITCH
}

// a size spanning exactly `cells` grid cells corner-to-corner (e.g. cellSpan(10) === 284)
export function cellSpan(cells) {
  return cells * DOT_PITCH + DOT_SIZE
}

// fixed image widths, independent of whether the resulting height fits the screen
export const PORTRAIT_WIDTH = cellSpan(10)
export const LANDSCAPE_WIDTH = cellSpan(28)

// the selection cursor/badge spans one grid cell corner-to-corner, same as cellSpan(1)
export const CURSOR_SIZE = cellSpan(1)

// the canvas delete-hint slides out exactly 2 grid cells, flush against the badge
export const DELETE_HINT_WIDTH = 2 * DOT_PITCH

// how long a hover must be held before a delete affordance appears (annotation badges, tabs)
export const HOVER_REVEAL_MS = 1000

// tab list: each row spans 7x2 grid cells, the trailing add-row is 2 bare pitches tall
export const TAB_WIDTH = cellSpan(7)
export const TAB_HEIGHT = cellSpan(2)
export const TAB_ADD_HEIGHT = 2 * DOT_PITCH

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// snaps a pixel offset to the nearest grid corner index (0..count-1) along one axis
export function snapIndex(value, margin, count) {
  return clamp(Math.round((value - margin) / DOT_PITCH), 0, count - 1)
}

// the on-canvas size an image renders at, independent of which tab it belongs to
export function imageDisplaySize(image, availableWidth) {
  const isPortrait = image.height > image.width
  const width = Math.min(isPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH, availableWidth)
  const height = width * (image.height / image.width)
  return { width, height }
}

export function rectFromCorners(anchorCol, anchorRow, col, row, gridX, gridY) {
  return {
    left: gridX.margin + Math.min(anchorCol, col) * DOT_PITCH,
    top: gridY.margin + Math.min(anchorRow, row) * DOT_PITCH,
    width: Math.abs(col - anchorCol) * DOT_PITCH + DOT_SIZE,
    height: Math.abs(row - anchorRow) * DOT_PITCH + DOT_SIZE,
  }
}

// converts a pixel rect (in canvas-viewport coordinates) to fractions of the image's own
// display box, so it can be persisted and reproduced on a page that has a different
// viewport/layout than the one that captured it (e.g. a shared read-only view)
export function rectToFraction(rect, layout) {
  return {
    x: (rect.left - layout.left) / layout.width,
    y: (rect.top - layout.top) / layout.height,
    width: rect.width / layout.width,
    height: rect.height / layout.height,
  }
}

// inverse of rectToFraction: places a persisted fraction rect into a freshly computed layout
export function fractionToRect(frac, layout) {
  return {
    left: layout.left + frac.x * layout.width,
    top: layout.top + frac.y * layout.height,
    width: frac.width * layout.width,
    height: frac.height * layout.height,
  }
}

// same idea as rectToFraction/fractionToRect, but for a single point (e.g. a badge's
// fixed-size anchor corner, which doesn't need its own width/height persisted)
export function pointToFraction(x, y, layout) {
  return { x: (x - layout.left) / layout.width, y: (y - layout.top) / layout.height }
}

export function fractionToPoint(frac, layout) {
  return { x: layout.left + frac.x * layout.width, y: layout.top + frac.y * layout.height }
}
