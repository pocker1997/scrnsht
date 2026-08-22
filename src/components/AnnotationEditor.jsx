import { useEffect, useRef } from 'react'
import heartSticker from '../assets/sticker-heart.png'
import catSticker from '../assets/sticker-cat.png'
import { ANNOTATION_COLORS, ANNOTATION_COLOR_ORDER } from '../lib/annotationColors.js'
import HoldToDeleteButton from './HoldToDeleteButton.jsx'
import SelectionBadge from './SelectionBadge.jsx'

const NOTE_MAX_LENGTH = 400

function resizeToFit(textarea) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

export default function AnnotationEditor({ rect, panel, number, note, color, onNoteChange, onColorChange, onDone, onCancel, onDelete }) {
  const textareaRef = useRef(null)
  const colors = ANNOTATION_COLORS[color] ?? ANNOTATION_COLORS.white

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [])

  useEffect(() => {
    resizeToFit(textareaRef.current)
  }, [note])

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    if (e.metaKey || e.shiftKey) return // let the browser insert a newline
    e.preventDefault()
    onDone()
  }

  return (
    <>
      <div
        className="selection-mask"
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
      <div
        className="annotation-panel"
        style={{ left: panel.left, top: panel.top, bottom: panel.bottom, width: panel.width }}
      >
        <SelectionBadge number={number} background={colors.badgeBg} textColor={colors.badgeText} />
        <textarea
          ref={textareaRef}
          className="annotation-panel__input"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing a note..."
          maxLength={NOTE_MAX_LENGTH}
          rows={1}
        />
      </div>

      <div className="annotation-toolbar-row">
        <div className="annotation-toolbar">
          <div className="annotation-toolbar__section">
            <span className="annotation-toolbar__label">Color</span>
            <div className="annotation-toolbar__swatches">
              {ANNOTATION_COLOR_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="annotation-swatch"
                  onClick={() => onColorChange(key)}
                  aria-label={key}
                  aria-pressed={color === key}
                >
                  <div
                    className={`annotation-swatch__fill${key === 'white' ? ' annotation-swatch__fill--white' : ''}`}
                    style={{ background: ANNOTATION_COLORS[key].swatch }}
                  />
                  {color === key && <div className="annotation-swatch__ring" />}
                </button>
              ))}
            </div>
          </div>
          <div className="annotation-toolbar__divider" />
          <div className="annotation-toolbar__section">
            <span className="annotation-toolbar__label">Stickers</span>
            <div className="annotation-toolbar__stickers">
              <img src={heartSticker} alt="" className="annotation-sticker" />
              <img src={catSticker} alt="" className="annotation-sticker" />
            </div>
          </div>
          <button type="button" className="annotation-toolbar__done" onClick={onDone}>
            DONE
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z" fill="white" />
            </svg>
          </button>
        </div>
        <div className="annotation-actions">
          {onDelete && (
            <>
              <HoldToDeleteButton variant="toolbar" onConfirm={onDelete} />
              <div className="annotation-actions__divider" />
            </>
          )}
          <button type="button" className="annotation-close" onClick={onCancel} aria-label="Cancel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
