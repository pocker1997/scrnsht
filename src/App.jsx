import { Suspense, lazy, useCallback, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import TokenPanel from './components/TokenPanel.jsx'
import { createShare } from './lib/share.js'
import { createTab, nameFromFile } from './lib/tabs.js'
import './App.css'

// dynamically imported so its ~600kB bundle only ships to browsers that actually use it
// (dev, or an explicit ?agentation=1 opt-in) instead of every production visitor
const Agentation = lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
const showAgentation = import.meta.env.DEV || new URLSearchParams(window.location.search).get('agentation') === '1'

function App() {
  const [tabs, setTabs] = useState(() => [createTab()])
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)

  const activeTab = tabs.find((t) => t.id === activeTabId)

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
            return { ...t, name, image: { url, width: probe.naturalWidth, height: probe.naturalHeight } }
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
        prev.map((t) =>
          t.id === activeTabId ? { ...t, annotations: typeof updater === 'function' ? updater(t.annotations) : updater } : t,
        ),
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
