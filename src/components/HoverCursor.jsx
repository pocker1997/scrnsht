export default function HoverCursor({ x, y }) {
  return (
    <div className="hover-cursor" style={{ left: x, top: y }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#111111" />
        <path d="M17 8H15V15H8V17H15V24H17V17H24V15H17V8Z" fill="white" />
      </svg>
    </div>
  )
}
