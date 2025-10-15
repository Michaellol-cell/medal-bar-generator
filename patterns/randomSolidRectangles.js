
    import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/**
 * Draw literal ribbon bands across a canvas in different layouts:
 * 'horizontal' | 'vertical' | 'grid' | 'diagonal' | 'random'
 *
 * Options:
 *  - type: 'horizontal'|'vertical'|'grid'|'diagonal'|'random' (default 'random')
 *  - weights: { horizontal:1, vertical:1, grid:0.5, diagonal:0.5 }
 *  - numberOfRectangles: integer (optional)
 *  - edge: boolean (default true) — draw a subtle edge stroke on each ribbon
 *  - alpha: number (0..1) default 1 — opacity for fills
 */
const randomSolidRectangles = (canvas, options = {}) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const {
    type = 'random',
    weights = { horizontal: 1, vertical: 1, grid: 0.6, diagonal: 0.6 },
    edge = true,
    alpha = 1,
  } = options

  // sensible default count based on PRNG (deterministic if your prng is)
  const defaultCount = prng() < 0.05 ? 1 : 2 + Math.floor(prng() * 4) // 2..5 usually
  const n = typeof options.numberOfRectangles === 'number' && options.numberOfRectangles > 0
    ? Math.max(1, Math.floor(options.numberOfRectangles))
    : defaultCount

  // ensure palette has enough colors
  const palette = selectPalette(Math.max(3, n))

  // helper: pick a type using weighted PRNG
  const pickType = (w) => {
    const entries = Object.entries(w)
    const total = entries.reduce((s, [, weight]) => s + weight, 0)
    let r = prng() * total
    for (const [key, weight] of entries) {
      if (r < weight) return key
      r -= weight
    }
    return entries[0][0]
  }

  const chosenType = (type === 'random') ? pickType(weights) : type

  // small helper to draw edges (stroked inside the fill to avoid seams)
  const strokeEdge = (x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`
    // inset stroke so it does not introduce extra outer pixels between adjacent fills
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
    ctx.restore()
  }

  // DRAW FUNCTIONS --------------------------------------------------------
  const drawHorizontal = () => {
    // integer heights that sum to canvas.height
    const base = Math.floor(canvas.height / n) || 1
    const remainder = canvas.height - base * n
    const heights = new Array(n).fill(base)
    for (let i = 0; i < remainder; i++) heights[i]++

    let y = 0
    for (let i = 0; i < n; i++) {
      const [r, g, b] = palette[i % palette.length]
      const h = heights[i]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillRect(0, y, canvas.width, h)
      if (edge) strokeEdge(0, y, canvas.width, h)
      y += h
    }
  }

  const drawVertical = () => {
    const base = Math.floor(canvas.width / n) || 1
    const remainder = canvas.width - base * n
    const widths = new Array(n).fill(base)
    for (let i = 0; i < remainder; i++) widths[i]++

    let x = 0
    for (let i = 0; i < n; i++) {
      const [r, g, b] = palette[i % palette.length]
      const w = widths[i]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillRect(x, 0, w, canvas.height)
      if (edge) strokeEdge(x, 0, w, canvas.height)
      x += w
    }
  }

  const drawGrid = () => {
    // split counts for v/h
    const vCount = Math.max(1, Math.floor(n / 2))
    const hCount = Math.max(1, n - vCount)
    const vPalette = selectPalette(Math.max(1, vCount))
    const hPalette = selectPalette(Math.max(1, hCount))

    // vertical bands integer distribution
    const vBase = Math.floor(canvas.width / vCount) || 1
    const vRem = canvas.width - vBase * vCount
    const vWidths = new Array(vCount).fill(vBase)
    for (let i = 0; i < vRem; i++) vWidths[i]++

    let x = 0
    for (let i = 0; i < vCount; i++) {
      const [r, g, b] = vPalette[i % vPalette.length]
      const w = vWidths[i]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillRect(x, 0, w, canvas.height)
      if (edge) strokeEdge(x, 0, w, canvas.height)
      x += w
    }

    // horizontal bands on top (overlay) integer distribution
    const hBase = Math.floor(canvas.height / hCount) || 1
    const hRem = canvas.height - hBase * hCount
    const hHeights = new Array(hCount).fill(hBase)
    for (let j = 0; j < hRem; j++) hHeights[j]++

    let y = 0
    for (let j = 0; j < hCount; j++) {
      const [r, g, b] = hPalette[j % hPalette.length]
      const hh = hHeights[j]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillRect(0, y, canvas.width, hh)
      if (edge) strokeEdge(0, y, canvas.width, hh)
      y += hh
    }
  }

  const drawDiagonal = () => {
    // draw diagonal ribbons by rotating the canvas and drawing vertical bands across a large rectangle
    const angle = (options && options.angle !== undefined) ? options.angle : -Math.PI / 6 // -30 degrees default
    const diag = Math.hypot(canvas.width, canvas.height)
    // pick integer band width
    const bandWidth = Math.max(8, Math.round(diag / n))

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(angle)

    // draw lots of bands across rotated space, with a 1px overlap to prevent seams
    const step = Math.max(1, bandWidth - 1)
    for (let i = -Math.round(diag) - bandWidth; i < Math.round(diag) + bandWidth; i += step) {
      const color = palette[Math.abs(Math.floor(i / bandWidth)) % palette.length]
      const [r, g, b] = color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      // add 2 px of overlap to be safe
      ctx.fillRect(i - 1, -diag - 1, bandWidth + 2, diag * 2 + 2)
      if (edge) {
        ctx.lineWidth = Math.max(1, Math.round(bandWidth * 0.04))
        ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.18, 0.06 + 0.02 * prng())})`
        ctx.strokeRect(i - 1 + 0.5, -diag - 1 + 0.5, bandWidth + 2 - 1, diag * 2 + 2 - 1)
      }
    }

    ctx.restore()
  }

  // DISPATCH ---------------------------------------------------------------
  switch (chosenType) {
    case 'horizontal':
      drawHorizontal()
      break
    case 'vertical':
      drawVertical()
      break
    case 'grid':
      drawGrid()
      break
    case 'diagonal':
      drawDiagonal()
      break
    default:
      // fallback: horizontal
      drawHorizontal()
      break
  }

  return { type: chosenType, count: n }
}

export default randomSolidRectangles
