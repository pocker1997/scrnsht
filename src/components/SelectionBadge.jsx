export default function SelectionBadge({ number, background, textColor, interactive = false, onActivate, style }) {
  const colorStyle = { background, color: textColor }

  if (!interactive) {
    return (
      <div className="selection-badge" style={{ ...colorStyle, ...style }}>
        {number}
      </div>
    )
  }

  return (
    <div
      className="selection-badge selection-badge--interactive"
      style={{ ...colorStyle, ...style }}
      role="button"
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      {number}
    </div>
  )
}
