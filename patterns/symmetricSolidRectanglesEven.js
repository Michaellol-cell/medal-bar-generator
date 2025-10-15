// symmetricSolidRectanglesEven.js
import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const clamp01 = v => Math.max(0, Math.min(1, v))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const normalizeTo8Bit = (col) => {
  if (!Array.isArray(col) || col.length < 3) return [0, 0, 0]
  return col.slice(0, 3).map((v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    if (n >= 0 && n <= 1) return Math.round(clamp01(n) * 255)
    if (n > 1 && n <= 255) return Math.round(n)
    if (n > 255 && n <= 65535) return Math.round(clamp(n / 65535, 0, 1) * 255)
    return Math.round(clamp(n, 0, 255))
  })
}

const symmetricSolidRectanglesEven = (canvas, numberOfPairs) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const pairs = (typeof numberOfPairs === 'number' && numberOfPairs > 0)
    ? Math.floor(numberOfPairs)
    : Math.max(1, Math.floor(2 + prng() * 4))

  const totalBands = pairs * 2
  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  const widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  const rawPalette = selectPalette(Math.max(3, totalBands))
  const palette = rawPalette.map(normalizeTo8Bit)

  for (let i = 0; i < pairs; i++) {
    // pick a color from palette (normalized)
    const raw = palette[Math.floor(prng() * palette.length)]
    const [r, g, b] = normalizeTo8Bit(raw) // safe-guard
    // left band (index i)
    let xLeft = 0
    for (let j = 0; j < i; j++) xLeft += widths[j]
    const wLeft = widths[i]
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, wLeft, canvas.height)

    // right band mirrored
    const rightIndex = totalBands - 1 - i
    let xRight = 0
    for (let j = 0; j < rightIndex; j++) xRight += widths[j]
    const wRight = widths[rightIndex]
    ctx.fillRect(xRight, 0, wRight, canvas.height)
  }

  // return useful metadata
  return { type: 'symmetric-even', pairs, bandWidths: widths }
}

export default symmetricSolidRectanglesEven
    
