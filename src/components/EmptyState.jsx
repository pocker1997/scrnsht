function AddIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" fill="#111111" />
      <path d="M31 22H29V29H22V31H29V38H31V31H38V29H31V22Z" fill="white" />
    </svg>
  )
}

export default function EmptyState({ onActivate }) {
  return (
    <div
      className="empty-state"
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onActivate()
      }}
    >
      <AddIcon />
      <p className="empty-state__text">Add your first screenshot or paste it using Cmd+V</p>
    </div>
  )
}
