import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/**
 * Draw literal ribbon bands across a canvas in different layouts:
 * 'horizontal' | 'vertical' | 'grid' | 'diagonal' | 'random' (pick one)
 *
 * Options:
 *  - type: 'horizontal'|'vertical'|'grid'|'diagonal'|'random' (default 'random')
 *  - weights: { horizontal:1, vertical:1, grid:0.5, diagonal:0.5 } // used when type === 'random'
 *  - numberOfRectangles: integer (optional) — if omitted a small PRNG-derived value is used
 *  - edge: boolean (default true) — draw a subtle edge stroke on each ribbon
 *  - alpha: number (0..1) default 1 — opacity for fills
 */
const randomSolidRectangles = (canvas, options = {}) => {
  const ctx = canvas.getContext('2d')
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

  // small helper to draw edges
  const strokeEdge = (x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1) // subpixel offset for crispness
    ctx.restore()
  }

  // DRAW FUNCTIONS --------------------------------------------------------
  const drawHorizontal = () => {
    const rectH = Math.floor(canvas.height / n)
    for (let i = 0; i < n; i++) {
      const [r, g, b] = palette[i % palette.length]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const y = i * rectH
      // Last rectangle extends to bottom edge to fill any gap
      const height = (i === n - 1) ? canvas.height - y : rectH
      ctx.fillRect(0, y, canvas.width, height)
      if (edge) strokeEdge(0, y, canvas.width, height)
    }
  }

  const drawVertical = () => {
    const rectW = Math.floor(canvas.width / n)
    for (let i = 0; i < n; i++) {
      const [r, g, b] = palette[i % palette.length]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const x = i * rectW
      // Last rectangle extends to right edge to fill any gap
      const width = (i === n - 1) ? canvas.width - x : rectW
      ctx.fillRect(x, 0, width, canvas.height)
      if (edge) strokeEdge(x, 0, width, canvas.height)
    }
  }

  const drawGrid = () => {
    // split the palette: first half vertical, second half horizontal (or reuse)
    const vCount = Math.max(1, Math.floor(n / 2))
    const hCount = Math.max(1, n - vCount)
    const vPalette = selectPalette(Math.max(1, vCount))
    const hPalette = selectPalette(Math.max(1, hCount))

    // vertical bands
    const rectW = Math.floor(canvas.width / vCount)
    for (let i = 0; i < vCount; i++) {
      const [r, g, b] = vPalette[i % vPalette.length]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const x = i * rectW
      // Last vertical band extends to right edge
      const width = (i === vCount - 1) ? canvas.width - x : rectW
      ctx.fillRect(x, 0, width, canvas.height)
      if (edge) strokeEdge(x, 0, width, canvas.height)
    }

    // horizontal bands on top (they overlay but are full bands — literal ribbon intersections)
    const rectH = Math.floor(canvas.height / hCount)
    for (let j = 0; j < hCount; j++) {
      const [r, g, b] = hPalette[j % hPalette.length]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const y = j * rectH
      // Last horizontal band extends to bottom edge
      const height = (j === hCount - 1) ? canvas.height - y : rectH
      ctx.fillRect(0, y, canvas.width, height)
      if (edge) strokeEdge(0, y, canvas.width, height)
    }
  }

  const drawDiagonal = () => {
    // draw diagonal ribbons by rotating the canvas, then drawing vertical bands across a large rectangle
    const angle = (options.angle !== undefined) ? options.angle : -Math.PI / 6 // -30 degrees default
    const diag = Math.hypot(canvas.width, canvas.height)
    const bandWidth = Math.max(8, Math.round(diag / n))

    ctx.save()
    // translate to center so rotation covers whole canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(angle)

    // draw tall vertical bands in rotated space that will appear diagonal on screen
    for (let i = -Math.round(diag); i < Math.round(diag); i += bandWidth) {
      const idx = Math.abs(Math.floor(i / bandWidth)) % palette.length
      const [r, g, b] = palette[idx]
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      // rectangle wide = bandWidth, tall enough to cover rotated canvas
      ctx.fillRect(i, -diag, bandWidth, diag * 2)
      if (edge) {
        // stroke edges in rotated space (subtle)
        ctx.lineWidth = Math.max(1, Math.round(bandWidth * 0.04))
        ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.18, 0.06 + 0.02 * prng())})`
        ctx.strokeRect(i + 0.5, -diag + 0.5, bandWidth - 1, diag * 2 - 1)
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

  // return meta so caller can know what was drawn (handy for tests)
  return { type: chosenType, count: n }
}

export default randomSolidRectangles
