import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useElementSize from '../hooks/useElementSize.js'
import { DEFAULT_ANNOTATION_COLOR } from '../lib/annotationColors.js'
import {
  CURSOR_SIZE,
  DELETE_HINT_WIDTH,
  DOT_PITCH,
  DOT_SIZE,
  EDGE_SKIP,
  axisMetrics,
  clamp,
  contentMargin,
  imageDisplaySize,
  pointToFraction,
  rectFromCorners,
  rectToFraction,
  snapIndex,
} from '../lib/grid.js'
import AnnotationBadge from './AnnotationBadge.jsx'
import AnnotationEditor from './AnnotationEditor.jsx'
import DotGrid from './DotGrid.jsx'
import EmptyState from './EmptyState.jsx'
import HoverCursor from './HoverCursor.jsx'
import ShareButton from './ShareButton.jsx'
import SelectionBadge from './SelectionBadge.jsx'
import SelectionBox from './SelectionBox.jsx'
import TabBar from './TabBar.jsx'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp']
const PANEL_MAX_WIDTH = 340
const PANEL_MIN_WIDTH = 256
// bottom toolbar's own height + margins, kept clear when the panel stacks below the selection
const TOOLBAR_CLEARANCE = 108

// panel sits `EDGE_SKIP` grid corners away from the selection's own corner — computed from
// raw grid indices, not the rect's pixel bounds, since those already include the dot's own
// size on their outer (right/bottom) edge and would throw off the corner alignment by DOT_SIZE.
// Prefers right/left of the selection; when neither side has room (a wide selection), it
// stacks above or below instead, whichever has more room, aligned to whichever side of the
// selection the drag started from.
function panelPlacement(anchorCol, anchorRow, col, row, gridX, gridY, viewport, contentHeight) {
  const minCol = Math.min(anchorCol, col)
  const maxCol = Math.max(anchorCol, col)
  const minRow = Math.min(anchorRow, row)
  const maxRow = Math.max(anchorRow, row)

  const canvasLeftEdge = contentMargin(viewport.width)
  const canvasRightEdge = viewport.width - contentMargin(viewport.width)
  const canvasTopEdge = contentMargin(viewport.height)
  const canvasBottomEdge = contentHeight - contentMargin(viewport.height)

  const rightCorner = gridX.margin + (maxCol + EDGE_SKIP) * DOT_PITCH
  const rightSpace = canvasRightEdge - rightCorner
  const leftCorner = gridX.margin + (minCol - EDGE_SKIP) * DOT_PITCH
  const leftSpace = leftCorner - canvasLeftEdge
  const rectTop = gridY.margin + minRow * DOT_PITCH

  if (rightSpace >= PANEL_MIN_WIDTH || leftSpace >= PANEL_MIN_WIDTH) {
    if (rightSpace >= leftSpace) {
      return { left: rightCorner, width: clamp(rightSpace, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH), top: rectTop }
    }
    const width = clamp(leftSpace, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
    return { left: leftCorner - width, width, top: rectTop }
  }

  const bottomCorner = gridY.margin + (maxRow + EDGE_SKIP) * DOT_PITCH
  const belowSpace = Math.min(canvasBottomEdge, contentHeight - TOOLBAR_CLEARANCE) - bottomCorner
  const topCorner = gridY.margin + (minRow - EDGE_SKIP) * DOT_PITCH
  const aboveSpace = topCorner - canvasTopEdge

  const rectLeft = gridX.margin + minCol * DOT_PITCH
  const rectWidth = (maxCol - minCol) * DOT_PITCH + DOT_SIZE
  const width = clamp(rectWidth, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)

  const anchorOnLeft = anchorCol <= col
  const idealLeft = anchorOnLeft ? rectLeft : rectLeft + rectWidth - width
  const left = clamp(idealLeft, canvasLeftEdge, canvasRightEdge - width)

  if (belowSpace >= aboveSpace) {
    return { left, width, top: bottomCorner }
  }
  return { left, width, bottom: contentHeight - topCorner }
}

export default function Canvas({
  image,
  onImage,
  annotations,
  onAnnotationsChange,
  onShare,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onDeleteTab,
}) {
  const fileInputRef = useRef(null)
  const contentRef = useRef(null)
  const [viewportRef, viewport] = useElementSize()
  const [hoverPos, setHoverPos] = useState(null)
  const [draft, setDraft] = useState(null)
  const [lastDeleted, setLastDeleted] = useState(null)
  const setAnnotations = onAnnotationsChange

  // switching tabs abandons any in-progress selection/edit and undo state from the
  // previous tab — none of it applies to the newly active tab's own annotations
  useEffect(() => {
    setDraft(null)
    setHoverPos(null)
    setLastDeleted(null)
  }, [activeTabId])

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items ?? []
      for (const item of items) {
        if (ACCEPTED_TYPES.includes(item.type)) {
          const file = item.getAsFile()
          if (file) onImage(file)
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [onImage])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onImage(file)
    e.target.value = ''
  }

  const layout = useMemo(() => {
    if (!image || !viewport.width || !viewport.height) return null

    const marginX = contentMargin(viewport.width)
    const marginY = contentMargin(viewport.height)
    const availableWidth = Math.max(0, viewport.width - marginX * 2)
    const { width, height } = imageDisplaySize(image, availableWidth)

    // center horizontally, but snap the left edge to a grid column so both
    // edges of the (grid-cell-sized) image land exactly on dot corners
    const idealLeft = (viewport.width - width) / 2
    const maxOffset = Math.max(0, Math.floor((availableWidth - width) / DOT_PITCH))
    const offset = clamp(Math.round((idealLeft - marginX) / DOT_PITCH), 0, maxOffset)

    return {
      left: marginX + offset * DOT_PITCH,
      top: marginY,
      width,
      height,
    }
  }, [image, viewport.width, viewport.height])

  // sized to fit the tallest image across ALL tabs, not just the active one — so the grid
  // and scroll geometry stay put while switching tabs, instead of jumping with each image
  const contentHeight = useMemo(() => {
    if (!viewport.width || !viewport.height) return viewport.height

    const marginY = contentMargin(viewport.height)
    const availableWidth = Math.max(0, viewport.width - contentMargin(viewport.width) * 2)

    let tallest = viewport.height
    for (const tab of tabs) {
      if (!tab.image) continue
      const { height } = imageDisplaySize(tab.image, availableWidth)
      tallest = Math.max(tallest, height + marginY * 2)
    }
    return tallest
  }, [tabs, viewport.width, viewport.height])

  const gridX = axisMetrics(viewport.width)
  const gridY = axisMetrics(contentHeight)

  // nearest grid corner to the raw pointer position — used to track the live/moving
  // corner of a selection as it grows
  const pointFromEvent = useCallback(
    (e) => {
      const rect = contentRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cols = axisMetrics(viewport.width)
      const rows = axisMetrics(contentHeight)
      return {
        col: snapIndex(x, cols.margin, cols.count),
        row: snapIndex(y, rows.margin, rows.count),
      }
    },
    [viewport.width, contentHeight],
  )

  // nearest grid cell (one pitch+dot square, same as the hover cursor) — its corners are
  // the candidates for where a new selection starts
  const cellFromEvent = useCallback(
    (e) => {
      const rect = contentRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { count: cols, margin: marginX } = axisMetrics(viewport.width)
      const { count: rows, margin: marginY } = axisMetrics(contentHeight)
      return {
        col: clamp(Math.round((x - marginX - CURSOR_SIZE / 2) / DOT_PITCH), 0, Math.max(0, cols - 2)),
        row: clamp(Math.round((y - marginY - CURSOR_SIZE / 2) / DOT_PITCH), 0, Math.max(0, rows - 2)),
      }
    },
    [viewport.width, contentHeight],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!image || draft) return
      const { col, row } = cellFromEvent(e)
      setHoverPos({
        x: gridX.margin + col * DOT_PITCH,
        y: gridY.margin + row * DOT_PITCH,
      })
    },
    [image, draft, cellFromEvent, gridX.margin, gridY.margin],
  )

  const openAnnotation = (annotation) => {
    if (draft) return
    setDraft({
      hoverCol: annotation.hoverCol,
      hoverRow: annotation.hoverRow,
      anchorCol: annotation.anchorCol,
      anchorRow: annotation.anchorRow,
      col: annotation.col,
      row: annotation.row,
      phase: 'editing',
      note: annotation.note,
      color: annotation.color,
      editingId: annotation.id,
    })
    setHoverPos(null)
  }

  const handleMouseDown = (e) => {
    if (!image || draft || e.button !== 0) return
    const { col, row } = cellFromEvent(e)

    const existing = annotations.find((a) => a.hoverCol === col && a.hoverRow === row)
    if (existing) {
      openAnnotation(existing)
      return
    }

    setDraft({
      hoverCol: col,
      hoverRow: row,
      anchorCol: null,
      anchorRow: null,
      col,
      row,
      startClientX: e.clientX,
      startClientY: e.clientY,
      phase: 'dragging',
      note: '',
      color: DEFAULT_ANNOTATION_COLOR,
      editingId: null,
      editingNumber: null,
    })
    setHoverPos(null)
  }

  const isDragging = draft?.phase === 'dragging'

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e) => {
      const { col, row } = pointFromEvent(e)
      setDraft((d) => {
        if (!d) return d
        let { anchorCol, anchorRow } = d
        if (anchorCol === null) {
          const dx = e.clientX - d.startClientX
          const dy = e.clientY - d.startClientY
          if (dx !== 0 || dy !== 0) {
            anchorCol = dx >= 0 ? d.hoverCol + 1 : d.hoverCol
            anchorRow = dy >= 0 ? d.hoverRow + 1 : d.hoverRow
          }
        }
        return { ...d, col, row, anchorCol, anchorRow }
      })
    }
    const handleUp = () => {
      setDraft((d) => {
        if (!d) return d
        if (d.anchorCol === null || (d.col === d.anchorCol && d.row === d.anchorRow)) return null
        return { ...d, phase: 'editing' }
      })
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, pointFromEvent])

  const isDraftActive = draft !== null

  useEffect(() => {
    if (!isDraftActive) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setDraft(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isDraftActive])

  const handleDone = () => {
    if (!draft) return
    setAnnotations((prev) =>
      draft.editingId
        ? prev.map((a) => (a.id === draft.editingId ? { ...a, note: draft.note, color: draft.color } : a))
        : [
            ...prev,
            {
              id: `${Date.now()}-${prev.length}`,
              hoverCol: draft.hoverCol,
              hoverRow: draft.hoverRow,
              anchorCol: draft.anchorCol,
              anchorRow: draft.anchorRow,
              col: draft.col,
              row: draft.row,
              note: draft.note,
              color: draft.color,
            },
          ],
    )
    setDraft(null)
  }

  const handleDeleteAnnotation = (id) => {
    const target = annotations.find((a) => a.id === id)
    if (target) setLastDeleted(target)
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }

  // Cmd/Ctrl+Z restores the last deleted annotation. Only listens while no draft is open, so
  // it never steals the browser's native undo from a focused textarea.
  useEffect(() => {
    if (draft) return
    const handleKey = (e) => {
      if (!lastDeleted) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        setAnnotations((prev) => [...prev, lastDeleted])
        setLastDeleted(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [draft, lastDeleted, setAnnotations])

  // numbers are derived from array position, not stored, so deleting an annotation
  // always closes the gap and no two annotations can ever show the same number
  const numberById = useMemo(() => {
    const map = new Map()
    annotations.forEach((a, i) => map.set(a.id, i + 1))
    return map
  }, [annotations])

  const hasAnchor = draft?.anchorCol !== null && draft?.anchorCol !== undefined
  const draftRect = hasAnchor ? rectFromCorners(draft.anchorCol, draft.anchorRow, draft.col, draft.row, gridX, gridY) : null
  const displayNumber = draft?.editingId ? numberById.get(draft.editingId) : annotations.length + 1

  const panelLayout = useMemo(() => {
    if (draft?.phase !== 'editing' || !hasAnchor) return null
    return panelPlacement(draft.anchorCol, draft.anchorRow, draft.col, draft.row, gridX, gridY, viewport, contentHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.phase, draft?.anchorCol, draft?.anchorRow, draft?.col, draft?.row, gridX.margin, gridY.margin, viewport.width, viewport.height, contentHeight])

  // converts the active tab's annotations from canvas-grid coordinates (only meaningful
  // relative to this browser's own viewport width) into fractions of the image's own
  // display box, which is all a shared read-only view — on a different device/viewport —
  // can reliably reproduce
  const handleShareClick = useCallback(() => {
    const shareAnnotations = annotations.map((a) => {
      const rect = rectFromCorners(a.anchorCol, a.anchorRow, a.col, a.row, gridX, gridY)
      const badgeX = gridX.margin + a.hoverCol * DOT_PITCH
      const badgeY = gridY.margin + a.hoverRow * DOT_PITCH
      return {
        id: a.id,
        note: a.note,
        color: a.color,
        rect: rectToFraction(rect, layout),
        badge: pointToFraction(badgeX, badgeY, layout),
      }
    })
    return onShare({ image, annotations: shareAnnotations })
  }, [annotations, gridX, gridY, image, layout, onShare])

  return (
    <div className="app-outer">
      <div className="canvas-area" ref={viewportRef}>
        <div
          className="canvas-content"
          ref={contentRef}
          style={{ height: contentHeight || '100%', cursor: image && draft?.phase !== 'editing' ? 'none' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPos(null)}
          onMouseDown={handleMouseDown}
        >
          <DotGrid width={viewport.width} height={contentHeight} />

          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={onSelectTab}
            onAdd={onAddTab}
            onDelete={onDeleteTab}
            style={{ left: gridX.margin, top: gridY.margin }}
          />

          {image && <ShareButton onShare={handleShareClick} />}

          {image && layout ? (
            <img
              className="stage-image"
              src={image.url}
              alt=""
              style={{ left: layout.left, top: layout.top, width: layout.width, height: layout.height }}
              draggable={false}
            />
          ) : (
            <EmptyState onActivate={() => fileInputRef.current?.click()} />
          )}
          {image && !draft && hoverPos && <HoverCursor x={hoverPos.x} y={hoverPos.y} />}

          {image &&
            annotations
              .filter((a) => a.id !== draft?.editingId)
              .map((a) => {
                const badgeX = gridX.margin + a.hoverCol * DOT_PITCH
                const badgeY = gridY.margin + a.hoverRow * DOT_PITCH
                const imageCenterX = layout ? layout.left + layout.width / 2 : viewport.width / 2
                let hintOnLeft = badgeX + CURSOR_SIZE / 2 < imageCenterX
                if (hintOnLeft && badgeX - DELETE_HINT_WIDTH < 0) hintOnLeft = false
                else if (!hintOnLeft && badgeX + CURSOR_SIZE + DELETE_HINT_WIDTH > viewport.width) hintOnLeft = true

                return (
                  <AnnotationBadge
                    key={a.id}
                    number={numberById.get(a.id)}
                    color={a.color}
                    x={badgeX}
                    y={badgeY}
                    hintOnLeft={hintOnLeft}
                    onActivate={() => openAnnotation(a)}
                    onDelete={() => handleDeleteAnnotation(a.id)}
                  />
                )
              })}

          {draft?.phase === 'dragging' && (
            <>
              {draftRect && <SelectionBox {...draftRect} />}
              <SelectionBadge
                number={displayNumber}
                background="#111111"
                textColor="#ffffff"
                style={{
                  position: 'absolute',
                  left: gridX.margin + draft.hoverCol * DOT_PITCH,
                  top: gridY.margin + draft.hoverRow * DOT_PITCH,
                }}
              />
            </>
          )}

          {draft?.phase === 'editing' && draftRect && panelLayout && (
            <AnnotationEditor
              rect={draftRect}
              panel={panelLayout}
              number={displayNumber}
              note={draft.note}
              color={draft.color}
              onNoteChange={(note) => setDraft((d) => (d ? { ...d, note } : d))}
              onColorChange={(color) => setDraft((d) => (d ? { ...d, color } : d))}
              onDone={handleDone}
              onCancel={() => setDraft(null)}
              onDelete={
                draft.editingId
                  ? () => {
                      handleDeleteAnnotation(draft.editingId)
                      setDraft(null)
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="visually-hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
