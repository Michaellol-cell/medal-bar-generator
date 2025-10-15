// randomSolidRectangles.js
import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/* Helpers ------------------------------------------------------------- */
const clamp01 = v => Math.max(0, Math.min(1, v))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/**
 * Normalize an arbitrary [r,g,b]-like array to 0..255 integers suitable for
 * canvas `rgba(r,g,b,a)`:
 * - accepts 0..1 floats (scale *255),
 * - accepts 0..255 ints (pass-through),
 * - accepts 0..65535 ints (scale down),
 * - coerces strings/nans -> 0
 */
const normalizeTo8Bit = (col) => {
  if (!Array.isArray(col) || col.length < 3) return [0, 0, 0]
  return col.slice(0, 3).map((v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    if (n >= 0 && n <= 1) return Math.round(clamp01(n) * 255)
    if (n > 1 && n <= 255) return Math.round(n)
    if (n > 255 && n <= 65535) return Math.round(clamp(n / 65535, 0, 1) * 255)
    // if larger or negative, clamp into 0..255
    return Math.round(clamp(n, 0, 255))
  })
}

/* Main exported function --------------------------------------------- */
const randomSolidRectangles = (canvas, options = {}) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const {
    type = 'random',
    weights = { horizontal: 1, vertical: 1, grid: 0.6, diagonal: 0.6 },
    edge = true,
    alpha = 1,
  } = options

  const defaultCount = prng() < 0.05 ? 1 : 2 + Math.floor(prng() * 4) // 2..5
  const n = (typeof options.numberOfRectangles === 'number' && options.numberOfRectangles > 0)
    ? Math.max(1, Math.floor(options.numberOfRectangles))
    : defaultCount

  // ask palette for enough colors; palette may return floats or ints — normalize below
  const rawPalette = selectPalette(Math.max(3, n))
  const palette = rawPalette.map(normalizeTo8Bit)

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

  const strokeEdge = (x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
    ctx.restore()
  }

  const drawHorizontal = () => {
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
    const vCount = Math.max(1, Math.floor(n / 2))
    const hCount = Math.max(1, n - vCount)
    const vPaletteRaw = selectPalette(Math.max(1, vCount))
    const hPaletteRaw = selectPalette(Math.max(1, hCount))
    const vPalette = vPaletteRaw.map(normalizeTo8Bit)
    const hPalette = hPaletteRaw.map(normalizeTo8Bit)

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
    const angle = (options && options.angle !== undefined) ? options.angle : -Math.PI / 6
    const diag = Math.hypot(canvas.width, canvas.height)
    const bandWidth = Math.max(8, Math.round(diag / n))

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(angle)

    const step = Math.max(1, bandWidth - 1)
    for (let i = -Math.round(diag) - bandWidth; i < Math.round(diag) + bandWidth; i += step) {
      const color = palette[Math.abs(Math.floor(i / bandWidth)) % palette.length]
      const [r, g, b] = color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillRect(i - 1, -diag - 1, bandWidth + 2, diag * 2 + 2)
      if (edge) {
        ctx.lineWidth = Math.max(1, Math.round(bandWidth * 0.04))
        ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.18, 0.06 + 0.02 * prng())})`
        ctx.strokeRect(i - 1 + 0.5, -diag - 1 + 0.5, bandWidth + 2 - 1, diag * 2 + 2 - 1)
      }
    }

    ctx.restore()
  }

  switch (chosenType) {
    case 'horizontal': drawHorizontal(); break
    case 'vertical': drawVertical(); break
    case 'grid': drawGrid(); break
    case 'diagonal': drawDiagonal(); break
    default: drawHorizontal(); break
  }

  return { type: chosenType, count: n }
}

export default randomSolidRectangles
    
