import { useMemo } from 'react'
import { DOT_PITCH, clamp, contentMargin, imageDisplaySize } from '../lib/grid.js'

// mirrors the centering/grid-snapping math Canvas.jsx uses when placing the editor's image,
// so a read-only view (which only knows the image's own width/height, not the sharer's
// viewport or multi-tab session) reproduces the same image display box that the persisted
// fraction-based annotation coordinates (see rectToFraction/pointToFraction) were computed
// against
export default function useImageLayout(viewport, image) {
  return useMemo(() => {
    if (!image || !viewport.width || !viewport.height) return null

    const marginX = contentMargin(viewport.width)
    const marginY = contentMargin(viewport.height)
    const availableWidth = Math.max(0, viewport.width - marginX * 2)
    const { width, height } = imageDisplaySize(image, availableWidth)

    const idealLeft = (viewport.width - width) / 2
    const maxOffset = Math.max(0, Math.floor((availableWidth - width) / DOT_PITCH))
    const offset = clamp(Math.round((idealLeft - marginX) / DOT_PITCH), 0, maxOffset)

    const contentHeight = Math.max(viewport.height, height + marginY * 2)

    return {
      layout: { left: marginX + offset * DOT_PITCH, top: marginY, width, height },
      contentHeight,
    }
  }, [image, viewport.width, viewport.height])
}
