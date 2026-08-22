export const DEFAULT_ANNOTATION_COLOR = 'white'

export const ANNOTATION_COLOR_ORDER = ['white', 'green', 'orange', 'red']

// per-color values, taken directly from Figma (badge/border don't always match the swatch
// chip exactly — e.g. green's badge+border is #0acf83 while its swatch chip and glow are #00d09f)
export const ANNOTATION_COLORS = {
  white: { swatch: '#ffffff', badgeBg: '#ffffff', badgeText: '#393939', border: '#ffffff', glow: null },
  green: { swatch: '#00d09f', badgeBg: '#0acf83', badgeText: '#111111', border: '#0acf83', glow: '#00d09f' },
  orange: { swatch: '#ff9e42', badgeBg: '#ff9e42', badgeText: '#111111', border: '#ff9e42', glow: '#ff9e42' },
  red: { swatch: '#ff4f4f', badgeBg: '#ff4f4f', badgeText: '#ffffff', border: '#ff4f4f', glow: '#ff4f4f' },
}
