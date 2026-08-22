// local persistence for tabs (image bytes + annotations), so a page refresh doesn't lose
// work — survives until the tab itself is deleted. IndexedDB (not localStorage) because it
// can store Blobs natively and has a much higher storage ceiling for screenshot-sized images.

const DB_NAME = 'scrnsht'
const DB_VERSION = 1
const STORE_NAME = 'tabs'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// tab: {id, name, annotations, image: {blob, width, height} | null}
export async function saveTab(tab) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(tab)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteTab(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// sorted by id, which embeds creation order (see createTab in lib/tabs.js:
// `tab-${Date.now()}-${counter}`), so tabs come back in the order they were created
export async function loadAllTabs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => (a.id < b.id ? -1 : 1)))
    req.onerror = () => reject(req.error)
  })
}
