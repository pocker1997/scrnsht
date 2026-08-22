import { useEffect, useState } from 'react'
import { fetchShare } from '../lib/share.js'
import AnnotationViewer from './AnnotationViewer.jsx'
import SharedLanding from './SharedLanding.jsx'

export default function SharedApp({ id }) {
  const [state, setState] = useState({ status: 'loading' })
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchShare(id)
      .then((row) => {
        if (cancelled) return
        setState(row ? { status: 'found', row } : { status: 'not-found' })
      })
      .catch((err) => {
        console.error('Failed to load shared tab', err)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === 'loading') return <div className="shared-empty">Loading…</div>
  if (state.status === 'not-found') return <div className="shared-empty">This link is no longer valid.</div>
  if (state.status === 'error') return <div className="shared-empty">Something went wrong loading this link.</div>

  const image = { url: state.row.image_url, width: state.row.image_width, height: state.row.image_height }
  const annotations = state.row.annotations ?? []

  if (viewerOpen) {
    return <AnnotationViewer image={image} annotations={annotations} onClose={() => setViewerOpen(false)} />
  }
  return <SharedLanding image={image} annotations={annotations} onStartView={() => setViewerOpen(true)} />
}
