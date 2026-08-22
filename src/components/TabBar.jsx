import { useEffect, useRef, useState } from 'react'
import { HOVER_REVEAL_MS, TAB_ADD_HEIGHT, TAB_HEIGHT, TAB_WIDTH } from '../lib/grid.js'
import HoldToDeleteButton from './HoldToDeleteButton.jsx'

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.75 3H7.25V7.25H3V8.75H7.25V13H8.75V8.75H13V7.25H8.75V3Z" fill="currentColor" />
    </svg>
  )
}

// active tab only: hovering it for HOVER_REVEAL_MS reveals a hold-to-delete button flush
// against its right edge, same reveal→hold pattern as an annotation badge's delete hint.
// canDelete is false when this is the last remaining tab — deletion isn't allowed there,
// so the hint never appears (nothing to hold-to-confirm).
function TabRow({ tab, active, canDelete, onSelect, onDelete }) {
  const [hintVisible, setHintVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleEnter = () => {
    if (!active || !canDelete) return
    timerRef.current = setTimeout(() => setHintVisible(true), HOVER_REVEAL_MS)
  }
  const handleLeave = () => {
    clearTimeout(timerRef.current)
    setHintVisible(false)
  }

  return (
    <div className="tab-row" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className={`tab-row__label${active ? ' tab-row__label--active' : ''}`}
        style={{ width: TAB_WIDTH, height: TAB_HEIGHT }}
        onClick={onSelect}
        title={tab.name}
      >
        <span className="tab-row__label-text">{tab.name}</span>
      </button>
      {active && canDelete && hintVisible && (
        <HoldToDeleteButton
          variant="hint"
          onConfirm={onDelete}
          ariaLabel={`Delete ${tab.name}`}
          style={{ width: TAB_HEIGHT, height: TAB_HEIGHT }}
        />
      )}
    </div>
  )
}

export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onDelete, style }) {
  const canDelete = tabs.length > 1

  return (
    <div className="tab-bar" style={style}>
      {tabs.map((tab) => (
        <TabRow
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          canDelete={canDelete}
          onSelect={() => onSelect(tab.id)}
          onDelete={() => onDelete(tab.id)}
        />
      ))}
      <button type="button" className="tab-bar__add" style={{ width: TAB_WIDTH, height: TAB_ADD_HEIGHT }} onClick={onAdd}>
        ADD
        <PlusIcon />
      </button>
    </div>
  )
}
