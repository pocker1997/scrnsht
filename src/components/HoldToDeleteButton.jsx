import { useEffect, useRef, useState } from 'react'

const HOLD_DURATION_MS = 1500

function TrashIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z"
        fill={color}
      />
    </svg>
  )
}

export default function HoldToDeleteButton({ onConfirm, variant = 'toolbar', style, ariaLabel = 'Delete' }) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setProgress(0)
  }

  const start = () => {
    const startedAt = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const p = Math.min(1, elapsed / HOLD_DURATION_MS)
      setProgress(p)
      if (p >= 1) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        onConfirm()
      }
    }, 16)
  }

  useEffect(() => () => cancel(), [])

  return (
    <div
      className={`hold-delete hold-delete--${variant}`}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        e.stopPropagation()
        start()
      }}
      onMouseUp={cancel}
      onMouseLeave={cancel}
    >
      <div className="hold-delete__fill" style={{ width: `${progress * 100}%` }} />
      <div className="hold-delete__icon">
        <TrashIcon color="#ff4f4f" />
      </div>
      <div className="hold-delete__icon" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}>
        <TrashIcon color="#ffffff" />
      </div>
    </div>
  )
}
