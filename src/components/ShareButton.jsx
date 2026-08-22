import { useEffect, useRef, useState } from 'react'

const SHARE_DURATION_MS = 3000

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 17H7C5.61667 17 4.4375 16.5125 3.4625 15.5375C2.4875 14.5625 2 13.3833 2 12C2 10.6167 2.4875 9.4375 3.4625 8.4625C4.4375 7.4875 5.61667 7 7 7H11V9H7C6.16667 9 5.45833 9.29167 4.875 9.875C4.29167 10.4583 4 11.1667 4 12C4 12.8333 4.29167 13.5417 4.875 14.125C5.45833 14.7083 6.16667 15 7 15H11V17ZM8 13V11H16V13H8ZM13 17V15H17C17.8333 15 18.5417 14.7083 19.125 14.125C19.7083 13.5417 20 12.8333 20 12C20 11.1667 19.7083 10.4583 19.125 9.875C18.5417 9.29167 17.8333 9 17 9H13V7H17C18.3833 7 19.5625 7.4875 20.5375 8.4625C21.5125 9.4375 22 10.6167 22 12C22 13.3833 21.5125 14.5625 20.5375 15.5375C19.5625 16.5125 18.3833 17 17 17H13Z"
        fill="white"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z" fill="white" />
    </svg>
  )
}

// idle -> click copies the link, then a disabled "sharing" state for SHARE_DURATION_MS with a
// right-to-left progress fill (4%-opacity overlay) before reverting to idle automatically
export default function ShareButton({ onShare, style }) {
  const [sharing, setSharing] = useState(false)
  const [filled, setFilled] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleClick = async () => {
    if (sharing) return
    setSharing(true)
    setFilled(true)
    timeoutRef.current = setTimeout(() => {
      setSharing(false)
      setFilled(false)
    }, SHARE_DURATION_MS)

    try {
      await onShare()
    } catch (err) {
      console.error('Failed to create share link', err)
      clearTimeout(timeoutRef.current)
      setSharing(false)
      setFilled(false)
    }
  }

  return (
    <button type="button" className="share-button" style={style} onClick={handleClick} disabled={sharing}>
      <div className="share-button__fill" style={{ width: filled ? '100%' : '0%' }} />
      <span className="share-button__content">
        <span className="share-button__label">{sharing ? 'COPIED!' : 'SHARE'}</span>
        {sharing ? <CheckIcon /> : <LinkIcon />}
      </span>
    </button>
  )
}
