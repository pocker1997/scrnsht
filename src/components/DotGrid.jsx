import { DOT_PITCH, DOT_SIZE, axisMetrics } from '../lib/grid.js'

const DOT_RADIUS = 1
const GRADIENT_FROM = '#d3d3d3'
const GRADIENT_TO = '#111111'
const GRADIENT_STOP_RATIO = 2.375 // gradient's second stop sits at 237.5% of the dot's height

export default function DotGrid({ width, height }) {
  if (!width || !height) return null

  const { count: cols, margin: marginX } = axisMetrics(width)
  const { count: rows, margin: marginY } = axisMetrics(height)

  const dots = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots.push({ x: marginX + col * DOT_PITCH, y: marginY + row * DOT_PITCH })
    }
  }

  return (
    <svg className="dot-grid" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="dot-grid-gradient" x1="0" y1="0" x2="0" y2={GRADIENT_STOP_RATIO} gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={GRADIENT_FROM} />
          <stop offset="1" stopColor={GRADIENT_TO} />
        </linearGradient>
      </defs>
      {dots.map((dot, i) => (
        <rect key={i} x={dot.x} y={dot.y} width={DOT_SIZE} height={DOT_SIZE} rx={DOT_RADIUS} fill="url(#dot-grid-gradient)" />
      ))}
    </svg>
  )
}
