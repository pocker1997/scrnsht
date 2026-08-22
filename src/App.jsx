import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import TokenPanel from './components/TokenPanel.jsx'
import { deleteTab as deleteStoredTab, loadAllTabs, saveTab } from './lib/db.js'
import { createShare } from './lib/share.js'
import { createTab, nameFromFile } from './lib/tabs.js'
import './App.css'

// dynamically imported so its ~600kB bundle only ships to browsers that actually use it
// (dev, or an explicit ?agentation=1 opt-in) instead of every production visitor
const Agentation = lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
const showAgentation = import.meta.env.DEV || new URLSearchParams(window.location.search).get('agentation') === '1'

function App() {
  const [tabs, setTabs] = useState(null)
  const [activeTabId, setActiveTabId] = useState(null)

  // hydrate from IndexedDB once on mount — tabs persist across reloads until explicitly
  // deleted, rather than resetting to a blank tab every time
  useEffect(() => {
    let cancelled = false
    loadAllTabs().then((saved) => {
      if (cancelled) return
      if (saved.length === 0) {
        const tab = createTab()
        setTabs([tab])
        setActiveTabId(tab.id)
        return
      }
      const hydrated = saved.map((t) => ({
        id: t.id,
        name: t.name,
        annotations: t.annotations,
        image: t.image ? { url: URL.createObjectURL(t.image.blob), width: t.image.width, height: t.image.height, blob: t.image.blob } : null,
      }))
      setTabs(hydrated)
      setActiveTabId(hydrated[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const activeTab = tabs?.find((t) => t.id === activeTabId)

  const handleImage = useCallback(
    (file) => {
      const url = URL.createObjectURL(file)
      const name = nameFromFile(file)
      const probe = new Image()
      probe.onload = () => {
        setTabs((prev) =>
          prev.map((t) => {
            if (t.id !== activeTabId) return t
            if (t.image) URL.revokeObjectURL(t.image.url)
            const image = { url, width: probe.naturalWidth, height: probe.naturalHeight, blob: file }
            saveTab({ id: t.id, name, annotations: t.annotations, image: { blob: file, width: image.width, height: image.height } })
            return { ...t, name, image }
          }),
        )
      }
      probe.src = url
    },
    [activeTabId],
  )

  const handleAnnotationsChange = useCallback(
    (updater) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t
          const annotations = typeof updater === 'function' ? updater(t.annotations) : updater
          saveTab({
            id: t.id,
            name: t.name,
            annotations,
            image: t.image ? { blob: t.image.blob, width: t.image.width, height: t.image.height } : null,
          })
          return { ...t, annotations }
        }),
      )
    },
    [activeTabId],
  )

  const handleShare = useCallback(async ({ image, annotations }) => {
    const id = crypto.randomUUID()
    // copy synchronously, before the upload's await — clipboard writes need to happen
    // inside the click's user-activation window, which the network round-trip can outlast
    await navigator.clipboard.writeText(`${window.location.origin}/s/${id}`)
    await createShare({ id, image, annotations })
  }, [])

  const handleAddTab = useCallback(() => {
    const tab = createTab()
    saveTab({ id: tab.id, name: tab.name, annotations: tab.annotations, image: null })
    setTabs((prev) => [...prev, tab])
    setActiveTabId(tab.id)
  }, [])

  const handleDeleteTab = useCallback(
    (id) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev
        const index = prev.findIndex((t) => t.id === id)
        if (index === -1) return prev
        const deleted = prev[index]
        if (deleted.image) URL.revokeObjectURL(deleted.image.url)
        deleteStoredTab(id)
        const next = prev.filter((t) => t.id !== id)
        if (id === activeTabId) {
          const neighbor = next[index] ?? next[index - 1]
          setActiveTabId(neighbor.id)
        }
        return next
      })
    },
    [activeTabId],
  )

  if (!tabs || !activeTab) return null

  return (
    <>
      <Canvas
        image={activeTab.image}
        onImage={handleImage}
        annotations={activeTab.annotations}
        onAnnotationsChange={handleAnnotationsChange}
        onShare={handleShare}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={handleAddTab}
        onDeleteTab={handleDeleteTab}
      />

      {import.meta.env.DEV && <TokenPanel />}
      {/* dev: always on. prod: opt-in via ?agentation=1, since the endpoint is localhost —
          only useful when the page is opened on the same machine as a running agent session */}
      {showAgentation && (
        <Suspense fallback={null}>
          <Agentation endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </>
  )
}

export default App
