import { useEffect, useState } from 'react'
import heartSticker from '../assets/sticker-heart.png'
import catSticker from '../assets/sticker-cat.png'
import { ANNOTATION_COLORS } from '../lib/annotationColors.js'
import { fractionToPoint, fractionToRect } from '../lib/grid.js'
import useElementSize from '../hooks/useElementSize.js'
import useImageLayout from '../hooks/useImageLayout.js'
import DotGrid from './DotGrid.jsx'
import SelectionBadge from './SelectionBadge.jsx'

const PANEL_WIDTH = 340
const PANEL_GAP = 16
const PANEL_MARGIN = 24

function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 19L4 12L11 5L12.4 6.4L7.8 11H20V13H7.8L12.4 17.6L11 19Z" fill="#111111" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 19L11.6 17.6L16.2 13H4V11H16.2L11.6 6.4L13 5L20 12L13 19Z" fill="#111111" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"
        fill="white"
      />
    </svg>
  )
}

// placement is intentionally simpler than the editor's drag-tuned panelPlacement — the
// viewer's spotlight rects are already fixed/known, so a below-else-above check is enough
function panelPlacement(rect, contentHeight, viewportWidth) {
  const width = Math.min(PANEL_WIDTH, viewportWidth - PANEL_MARGIN * 2)
  const left = Math.min(Math.max(rect.left, PANEL_MARGIN), viewportWidth - width - PANEL_MARGIN)
  const spaceBelow = contentHeight - (rect.top + rect.height)
  const spaceAbove = rect.top

  if (spaceBelow >= spaceAbove) {
    return { left, width, top: rect.top + rect.height + PANEL_GAP }
  }
  return { left, width, bottom: contentHeight - rect.top + PANEL_GAP }
}

export default function AnnotationViewer({ image, annotations, onClose }) {
  const [viewportRef, viewport] = useElementSize()
  const sized = useImageLayout(viewport, image)
  const [currentIndex, setCurrentIndex] = useState(0)

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const goNext = () => setCurrentIndex((i) => Math.min(annotations.length - 1, i + 1))

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations.length, onClose])

  if (!sized) {
    return (
      <div className="app-outer">
        <div className="canvas-area" ref={viewportRef} />
      </div>
    )
  }

  const current = annotations[currentIndex]
  const rect = fractionToRect(current.rect, sized.layout)
  const colors = ANNOTATION_COLORS[current.color] ?? ANNOTATION_COLORS.white
  const panel = panelPlacement(rect, sized.contentHeight, viewport.width)

  return (
    <div className="app-outer">
      <div className="canvas-area" ref={viewportRef}>
        <div className="canvas-content" style={{ height: sized.contentHeight }}>
          <DotGrid width={viewport.width} height={sized.contentHeight} />

          <img
            className="stage-image"
            src={image.url}
            alt=""
            style={{ left: sized.layout.left, top: sized.layout.top, width: sized.layout.width, height: sized.layout.height }}
            draggable={false}
          />

          {annotations.map((a, i) => {
            if (i === currentIndex) return null
            const point = fractionToPoint(a.badge, sized.layout)
            const c = ANNOTATION_COLORS[a.color] ?? ANNOTATION_COLORS.white
            return (
              <SelectionBadge
                key={a.id}
                number={i + 1}
                background={c.badgeBg}
                textColor={c.badgeText}
                style={{ position: 'absolute', left: point.x, top: point.y, opacity: 0.5 }}
              />
            )
          })}

          <div
            className="annotation-viewer-mask"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              borderColor: colors.border,
              boxShadow: colors.glow
                ? `0 0 16px 0 ${colors.glow}, 0 0 0 9999px rgba(0, 0, 0, 0.72)`
                : '0 0 0 9999px rgba(0, 0, 0, 0.72)',
            }}
          />

          <div className="annotation-viewer__counter" style={{ left: sized.layout.left + sized.layout.width / 2 }}>
            {currentIndex + 1}/{annotations.length}
          </div>

          <div
            key={current.id}
            className="annotation-panel"
            style={{ left: panel.left, top: panel.top, bottom: panel.bottom, width: panel.width }}
          >
            <SelectionBadge number={currentIndex + 1} background={colors.badgeBg} textColor={colors.badgeText} />
            <p className="annotation-panel__note-text">{current.note}</p>
          </div>
        </div>
      </div>

      <div className="annotation-toolbar-row">
        <div className="annotation-toolbar annotation-toolbar--viewer">
          <div className="annotation-toolbar__nav-group">
            <button type="button" className="annotation-toolbar__nav" onClick={goPrev} aria-label="Previous annotation">
              <ArrowLeftIcon />
            </button>
            <div className="annotation-toolbar__divider" />
          </div>
          <div className="annotation-toolbar__section">
            <span className="annotation-toolbar__label">Reactions</span>
            <div className="annotation-toolbar__stickers">
              <img src={heartSticker} alt="" className="annotation-sticker" />
              <img src={catSticker} alt="" className="annotation-sticker" />
            </div>
          </div>
          <div className="annotation-toolbar__nav-group">
            <div className="annotation-toolbar__divider" />
            <button type="button" className="annotation-toolbar__nav" onClick={goNext} aria-label="Next annotation">
              <ArrowRightIcon />
            </button>
          </div>
        </div>
        <div className="annotation-actions">
          <button type="button" className="annotation-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
