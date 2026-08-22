import { useState, useEffect } from 'react'

const TOKENS = [
  { name: '--color-brand',      type: 'color' },
  { name: '--color-surface',    type: 'color' },
  { name: '--color-ink',        type: 'color' },
  { name: '--radius-card',      type: 'size', min: 0, max: 40 },
  { name: '--spacing-gutter',   type: 'size', min: 0, max: 64 },
  { name: '--spacing-pixel',    type: 'size', min: 2, max: 48 },
  { name: '--spacing-pixel-gap',type: 'size', min: 0, max: 12 },
]

export default function TokenPanel() {
  const [values, setValues] = useState({})
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const initial = {}
    TOKENS.forEach(t => { initial[t.name] = styles.getPropertyValue(t.name).trim() })
    setValues(initial)
  }, [])

  const update = (name, value) => {
    document.documentElement.style.setProperty(name, value)
    setValues(v => ({ ...v, [name]: value }))
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position:'fixed', left:16, bottom:16, zIndex:9998 }}>
        Tokens
      </button>
    )
  }

  return (
    <div style={{
      position:'fixed', left:16, bottom:16, zIndex:9998,
      background:'#fff', border:'1px solid #e4e4e7', borderRadius:8,
      padding:12, width:240, fontSize:12, fontFamily:'system-ui',
      boxShadow:'0 4px 16px rgba(0,0,0,.12)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <strong>Tokens</strong>
        <button onClick={() => setOpen(false)}>×</button>
      </div>
      {TOKENS.map(t => (
        <div key={t.name} style={{ marginBottom:8 }}>
          <div style={{ color:'#71717a', marginBottom:2 }}>{t.name}</div>
          {t.type === 'color' ? (
            <input type="color" value={values[t.name] || '#000000'}
              onChange={e => update(t.name, e.target.value)}
              style={{ width:'100%', height:24 }} />
          ) : (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="range" min={t.min} max={t.max}
                value={parseInt(values[t.name]) || 0}
                onChange={e => update(t.name, `${e.target.value}px`)}
                style={{ flex:1 }} />
              <span style={{ width:38 }}>{values[t.name]}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}