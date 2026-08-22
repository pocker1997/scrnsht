export const UNTITLED_TAB_NAME = 'Untitled'

let tabCounter = 0

export function createTab() {
  tabCounter += 1
  return {
    id: `tab-${Date.now()}-${tabCounter}`,
    name: UNTITLED_TAB_NAME,
    image: null,
    annotations: [],
  }
}

// strips the extension off an uploaded/pasted filename to use as the tab label
export function nameFromFile(file) {
  const raw = file?.name?.trim()
  if (!raw) return UNTITLED_TAB_NAME
  const dot = raw.lastIndexOf('.')
  return dot > 0 ? raw.slice(0, dot) : raw
}
