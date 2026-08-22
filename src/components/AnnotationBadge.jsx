import { useEffect, useRef, useState } from 'react'
import { ANNOTATION_COLORS } from '../lib/annotationColors.js'
import { CURSOR_SIZE, DELETE_HINT_WIDTH, HOVER_REVEAL_MS } from '../lib/grid.js'
import HoldToDeleteButton from './HoldToDeleteButton.jsx'
import SelectionBadge from './SelectionBadge.jsx'

// badge + its hover-reveal delete hint, wrapped in one hoverable box (badge width + hint
// width) so moving the pointer from the badge onto the hint never drops the hover state
export default function AnnotationBadge({ number, color, x, y, hintOnLeft, onActivate, onDelete }) {
  const colors = ANNOTATION_COLORS[color] ?? ANNOTATION_COLORS.white
  const [hintVisible, setHintVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setHintVisible(true), HOVER_REVEAL_MS)
  }
  const handleLeave = () => {
    clearTimeout(timerRef.current)
    setHintVisible(false)
  }

  return (
    <div
      className="annotation-badge-zone"
      style={{
        left: hintOnLeft ? x - DELETE_HINT_WIDTH : x,
        top: y,
        width: CURSOR_SIZE + DELETE_HINT_WIDTH,
        flexDirection: hintOnLeft ? 'row-reverse' : 'row',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <SelectionBadge
        number={number}
        background={colors.badgeBg}
        textColor={colors.badgeText}
        interactive
        onActivate={onActivate}
        style={{ flexShrink: 0 }}
      />
      {hintVisible && (
        <HoldToDeleteButton variant="hint" onConfirm={onDelete} style={{ width: DELETE_HINT_WIDTH, height: CURSOR_SIZE }} />
      )}
    </div>
  )
}
