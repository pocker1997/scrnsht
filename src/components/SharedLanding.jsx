import { fractionToPoint } from '../lib/grid.js'
import useElementSize from '../hooks/useElementSize.js'
import useImageLayout from '../hooks/useImageLayout.js'
import DotGrid from './DotGrid.jsx'
import SelectionBadge from './SelectionBadge.jsx'
import { ANNOTATION_COLORS } from '../lib/annotationColors.js'

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5V19L19 12L8 5Z" fill="white" />
    </svg>
  )
}

export default function SharedLanding({ image, annotations, onStartView }) {
  const [viewportRef, viewport] = useElementSize()
  const sized = useImageLayout(viewport, image)

  return (
    <div className="app-outer">
      <div className="canvas-area" ref={viewportRef}>
        <div className="canvas-content" style={{ height: sized?.contentHeight || '100%' }}>
          <DotGrid width={viewport.width} height={sized?.contentHeight} />

          {sized && (
            <img
              className="stage-image"
              src={image.url}
              alt=""
              style={{ left: sized.layout.left, top: sized.layout.top, width: sized.layout.width, height: sized.layout.height }}
              draggable={false}
            />
          )}

          {sized &&
            annotations.map((a, i) => {
              const point = fractionToPoint(a.badge, sized.layout)
              const colors = ANNOTATION_COLORS[a.color] ?? ANNOTATION_COLORS.white
              return (
                <SelectionBadge
                  key={a.id}
                  number={i + 1}
                  background={colors.badgeBg}
                  textColor={colors.badgeText}
                  style={{ position: 'absolute', left: point.x, top: point.y }}
                />
              )
            })}
        </div>
      </div>

      {annotations.length > 0 && (
        <button type="button" className="start-view-button" onClick={onStartView}>
          START VIEW
          <PlayIcon />
        </button>
      )}
    </div>
  )
}
