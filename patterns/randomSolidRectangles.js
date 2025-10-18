import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/**
 * Draw literal ribbon bands across a canvas in different layouts:
 * 'horizontal' | 'vertical' | 'grid' | 'diagonal' | 'random'
 *
 * Options (preserve existing defaults):
 *  - type: 'horizontal'|'vertical'|'grid'|'diagonal'|'random' (default 'random')
 *  - weights: { horizontal:1, vertical:1, grid:0.5, diagonal:0.5 }
 *  - numberOfRectangles: integer (optional)
 *  - edge: boolean (default true)
 *  - alpha: number (0..1) default 1
 *
 * New optional extras (safe defaults so original behavior is preserved):
 *  - oddEven: 'both'|'odd'|'even' (default 'both') — draw only odd/even bands
 *  - jitter: number (px) default 0 — jitter each band's thickness by ±jitter
 *  - stagger: boolean default false — shift alternating bands by half-band for a staggered look
 *  - variant: 'solid'|'wavy' (default 'solid') — wavy will sinusoidally perturb the band's edge
 *  - seedless: boolean default false — if true, we use Math.random instead of prng() for extra randomness
 *  - angle: number (radians) only for diagonal (default -Math.PI/6 — preserved)
 */
const randomSolidRectangles = (canvas, options = {}) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const {
    type = 'random',
    weights = { horizontal: 1, vertical: 1, grid: 0.6, diagonal: 0.6 },
    edge = true,
    alpha = 1,

    // new options with safe defaults
    oddEven = 'both',   // 'both' | 'odd' | 'even'
    jitter = 0,         // px, default 0 preserves original
    stagger = false,    // offset every other band by ~half spacing
    variant = 'solid',  // 'solid' | 'wavy'
    seedless = false,   // if true, use Math.random instead of prng()
    angle = (options && options.angle !== undefined) ? options.angle : -Math.PI / 6,
  } = options

  // preserve original deterministic PRNG unless user wants seedless randomness
  const rnd = seedless ? Math.random : prng

  // helpers -------------------------------------------------------
  const randBetween = (a, b) => a + (b - a) * rnd()
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

  // preserve original default count math exactly
  const defaultCount = prng() < 0.05 ? 1 : 2 + Math.floor(prng() * 4) // 2..5 usually
  const n = typeof options.numberOfRectangles === 'number' && options.numberOfRectangles > 0
    ? Math.max(1, Math.floor(options.numberOfRectangles))
    : defaultCount

  // ensure palette has enough colors (preserve original: selectPalette(Math.max(3,n)))
  const palette = selectPalette(Math.max(3, n))

  // pick type using existing weighted PRNG logic
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

  // odd/even filter helper: index i starts at 0
  const useIndex = (i) => {
    if (oddEven === 'both') return true
    if (oddEven === 'odd') return (i % 2) === 1
    return (i % 2) === 0 // 'even'
  }

  // stroke helper kept almost identical to original to preserve look
  const strokeEdge = (x, y, w, h, bandWidthOverride) => {
    ctx.save()
    ctx.globalAlpha = 1
    const lw = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.05)))
    ctx.lineWidth = bandWidthOverride !== undefined ? bandWidthOverride : lw
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
    ctx.restore()
  }

  // two small drawing utilities to produce wavy ribbons if variant==='wavy'
  const fillWavyHorizontalBand = (x, y, w, h, amplitude = Math.max(4, Math.round(h * 0.25))) => {
    const waveLength = Math.max(30, Math.round(w / 2))
    const phase = randBetween(0, Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let xx = x; xx <= x + w; xx += 2) {
      const wy = y + Math.sin(((xx - x) / waveLength) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(xx, wy)
    }
    for (let xx = x + w; xx >= x; xx -= 2) {
      const wy = y + h + Math.sin(((xx - x) / waveLength) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(xx, wy)
    }
    ctx.closePath()
    ctx.fill()
  }

  const fillWavyVerticalBand = (x, y, w, h, amplitude = Math.max(4, Math.round(w * 0.25))) => {
    const waveLength = Math.max(30, Math.round(h / 2))
    const phase = randBetween(0, Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let yy = y; yy <= y + h; yy += 2) {
      const wx = x + Math.sin(((yy - y) / waveLength) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(wx, yy)
    }
    for (let yy = y + h; yy >= y; yy -= 2) {
      const wx = x + w + Math.sin(((yy - y) / waveLength) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(wx, yy)
    }
    ctx.closePath()
    ctx.fill()
  }

  // DRAW FUNCTIONS --------------------------------------------------------
  const drawHorizontal = () => {
    // integer heights that sum to canvas.height (as original)
    const base = Math.floor(canvas.height / n) || 1
    const remainder = canvas.height - base * n
    const heights = new Array(n).fill(base)
    for (let i = 0; i < remainder; i++) heights[i]++

    // apply jitter per-band but keep total coverage: we adjust each band then fix last
    let y = 0
    for (let i = 0; i < n; i++) {
      if (!useIndex(i)) {
        // if odd/even filter excludes this band, skip but still advance y by base (so the distribution visually stays)
        y += heights[i]
        continue
      }

      const [r, g, b] = palette[i % palette.length]

      // jitter modifies height but the last drawn band will absorb remainder to always fill
      let thisH = heights[i] + Math.round(randBetween(-jitter, jitter))
      // ensure reasonable minimum
      thisH = Math.max(1, thisH)

      // if we're at the last index (i === n-1), clamp to remaining space to avoid overflow/holes
      if (i === n - 1) thisH = canvas.height - y

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

      if (variant === 'wavy') {
        fillWavyHorizontalBand(0, y, canvas.width, thisH)
      } else {
        ctx.fillRect(0, y, canvas.width, thisH)
      }

      if (edge) {
        // apply stagger offset to stroke x if requested (visual only)
        strokeEdge(0, y, canvas.width, thisH)
      }

      // optional stagger: shift next y by half-band occasionally (visual offset)
      if (stagger && (i % 2 === 1)) {
        // move next y a bit to create stagger - this doesn't change total coverage since next band will start at this y
        y += thisH - Math.round(Math.max(0, Math.min(thisH * 0.3, thisH * randBetween(0, 0.5))))
      } else {
        y += thisH
      }
    }
  }

  const drawVertical = () => {
    const base = Math.floor(canvas.width / n) || 1
    const remainder = canvas.width - base * n
    const widths = new Array(n).fill(base)
    for (let i = 0; i < remainder; i++) widths[i]++

    let x = 0
    for (let i = 0; i < n; i++) {
      if (!useIndex(i)) {
        x += widths[i]
        continue
      }

      const [r, g, b] = palette[i % palette.length]
      let thisW = widths[i] + Math.round(randBetween(-jitter, jitter))
      thisW = Math.max(1, thisW)
      if (i === n - 1) thisW = canvas.width - x

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

      if (variant === 'wavy') {
        fillWavyVerticalBand(x, 0, thisW, canvas.height)
      } else {
        ctx.fillRect(x, 0, thisW, canvas.height)
      }

      if (edge) strokeEdge(x, 0, thisW, canvas.height)

      if (stagger && (i % 2 === 1)) {
        x += thisW - Math.round(Math.max(0, Math.min(thisW * 0.3, thisW * randBetween(0, 0.5))))
      } else {
        x += thisW
      }
    }
  }

  const drawGrid = () => {
    // split counts for v/h similar to original
    const vCount = Math.max(1, Math.floor(n / 2))
    const hCount = Math.max(1, n - vCount)
    const vPalette = selectPalette(Math.max(1, vCount))
    const hPalette = selectPalette(Math.max(1, hCount))

    // vertical bands integer distribution (apply jitter and oddEven)
    const vBase = Math.floor(canvas.width / vCount) || 1
    const vRem = canvas.width - vBase * vCount
    const vWidths = new Array(vCount).fill(vBase)
    for (let i = 0; i < vRem; i++) vWidths[i]++

    let x = 0
    for (let i = 0; i < vCount; i++) {
      if (!useIndex(i)) {
        x += vWidths[i]
        continue
      }
      const [r, g, b] = vPalette[i % vPalette.length]
      let w = vWidths[i] + Math.round(randBetween(-jitter, jitter))
      w = Math.max(1, w)
      if (i === vCount - 1) w = canvas.width - x

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      if (variant === 'wavy') {
        fillWavyVerticalBand(x, 0, w, canvas.height)
      } else {
        ctx.fillRect(x, 0, w, canvas.height)
      }
      if (edge) strokeEdge(x, 0, w, canvas.height)
      x += w
    }

    // horizontal bands on top (overlay); preserve original layering
    const hBase = Math.floor(canvas.height / hCount) || 1
    const hRem = canvas.height - hBase * hCount
    const hHeights = new Array(hCount).fill(hBase)
    for (let j = 0; j < hRem; j++) hHeights[j]++

    let y = 0
    for (let j = 0; j < hCount; j++) {
      if (!useIndex(j)) {
        y += hHeights[j]
        continue
      }
      const [r, g, b] = hPalette[j % hPalette.length]
      let hh = hHeights[j] + Math.round(randBetween(-jitter, jitter))
      hh = Math.max(1, hh)
      if (j === hCount - 1) hh = canvas.height - y

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      if (variant === 'wavy') {
        fillWavyHorizontalBand(0, y, canvas.width, hh)
      } else {
        ctx.fillRect(0, y, canvas.width, hh)
      }
      if (edge) strokeEdge(0, y, canvas.width, hh)
      y += hh
    }
  }

  const drawDiagonal = () => {
    // preserve original diagonal behavior but add odd/even and jitter support, plus variant wavy option
    const diag = Math.hypot(canvas.width, canvas.height)
    const bandWidth = Math.max(8, Math.round(diag / n))
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(angle)

    const step = Math.max(1, bandWidth - 1)
    let idx = 0
    for (let i = -Math.round(diag) - bandWidth; i < Math.round(diag) + bandWidth; i += step) {
      if (!useIndex(idx++)) continue
      const color = palette[Math.abs(Math.floor(i / bandWidth)) % palette.length]
      const [r, g, b] = color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const jitterShift = Math.round(randBetween(-jitter, jitter))
      const drawX = i + jitterShift

      if (variant === 'wavy') {
        // wavy diagonal: create a large path with sinusoidal top/bottom edges
        const w = bandWidth + 2
        const h = diag * 2 + 2
        // approximate by drawing many small rects offset with sin
        ctx.save()
        ctx.translate(drawX, -diag - 1)
        for (let sx = 0; sx < w; sx += 4) {
          const offset = Math.sin((sx / Math.max(10, w)) * Math.PI * 2 + randBetween(0, Math.PI * 2)) * Math.max(6, Math.round(w * 0.2))
          ctx.fillRect(sx, offset, 4, h - offset)
        }
        ctx.restore()
      } else {
        ctx.fillRect(drawX - 1, -diag - 1, bandWidth + 2, diag * 2 + 2)
      }

      if (edge) {
        ctx.lineWidth = Math.max(1, Math.round(bandWidth * 0.04))
        ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.18, 0.06 + 0.02 * prng())})`
        ctx.strokeRect(drawX - 1 + 0.5, -diag - 1 + 0.5, bandWidth + 2 - 1, diag * 2 + 2 - 1)
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
      // fallback: horizontal (preserve original)
      drawHorizontal()
      break
  }

  return { type: chosenType, count: n }
}

export default randomSolidRectangles
                              
