import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/**
 * Odd-only symmetric ribbons (center band + mirrored pairs).
 *
 * Backwards-compatible:
 *  - symmetricSolidRectanglesOdd(canvas, bandsEachSide)
 *  - symmetricSolidRectanglesOdd(canvas, { bandsEachSide, jitter, edge, alpha, variant, seedless })
 *
 * New options (safe defaults preserve original behavior):
 *  - bandsEachSide: integer (overrides numeric second arg)
 *  - jitter: number (px) default 0 — jitter band widths by ±jitter (then normalize)
 *  - edge: boolean default false — draw subtle stroke around bands
 *  - alpha: number (0..1) default 1 — opacity for fills
 *  - variant: 'solid'|'wavy' default 'solid'
 *  - seedless: boolean default false — use Math.random instead of prng()
 */
const symmetricSolidRectanglesOdd = (canvas, bandsEachSideOrOptions = undefined) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // normalize arguments for backward compatibility
  let options = {}
  if (typeof bandsEachSideOrOptions === 'number') {
    options.bandsEachSide = Math.floor(bandsEachSideOrOptions)
  } else if (typeof bandsEachSideOrOptions === 'object' && bandsEachSideOrOptions !== null) {
    options = bandsEachSideOrOptions
  }

  const {
    bandsEachSide,              // optional override (same as original param)
    jitter = 0,                 // px jitter applied to band widths (default 0)
    edge = false,               // default original had strokes commented out
    alpha = 1,                  // original behavior used full opacity
    variant = 'solid',          // 'solid' | 'wavy'
    seedless = false,           // false -> use prng(), true -> Math.random()
  } = options

  const rnd = seedless ? Math.random : prng
  const randBetween = (a, b) => a + (b - a) * rnd()
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

  // preserve original default count behaviour (use prng for original-seeming determinism)
  const n = (typeof bandsEachSide === 'number' && bandsEachSide > 0)
    ? Math.floor(bandsEachSide)
    : Math.max(2, Math.floor(2 + prng() * 3)) // original default: 2..4 (=> total 3..7)

  const pairs = n - 1
  const totalBands = 2 * n - 1

  // integer widths that sum exactly to canvas.width
  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  let widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  // apply jitter if requested and renormalize to integer canvas.width
  if (jitter && jitter > 0) {
    const widthsFloat = widths.map(w => w + randBetween(-jitter, jitter))
    for (let i = 0; i < widthsFloat.length; i++) widthsFloat[i] = Math.max(1, widthsFloat[i])
    const floatSum = widthsFloat.reduce((s, v) => s + v, 0)
    const scale = canvas.width / floatSum
    let scaled = widthsFloat.map(v => v * scale)
    let intWidths = scaled.map(v => Math.floor(v))
    let diff = canvas.width - intWidths.reduce((s, v) => s + v, 0)
    for (let k = 0; diff > 0; k++, diff--) {
      intWidths[k % intWidths.length]++
    }
    for (let k = 0; diff < 0; k++, diff++) {
      const idx = k % intWidths.length
      if (intWidths[idx] > 1) intWidths[idx]--
    }
    widths = intWidths
  }

  const palette = selectPalette(Math.max(3, totalBands))

  // subtle inside stroke reused when edge=true
  const strokeEdge = (x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * rnd())})`
    ctx.strokeRect(x + 0.5, 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
    ctx.restore()
  }

  // optional wavy vertical band filler
  const fillWavyVerticalBand = (x, y, w, h, amplitude = Math.max(4, Math.round(w * 0.25))) => {
    const waveLen = Math.max(30, Math.round(h / 2))
    const phase = randBetween(0, Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let yy = y; yy <= y + h; yy += 2) {
      const wx = x + Math.sin(((yy - y) / waveLen) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(wx, yy)
    }
    for (let yy = y + h; yy >= y; yy -= 2) {
      const wx = x + w + Math.sin(((yy - y) / waveLen) * Math.PI * 2 + phase) * amplitude
      ctx.lineTo(wx, yy)
    }
    ctx.closePath()
    ctx.fill()
  }

  // helper: draw band at absolute band index
  const drawBandAtIndex = (bandIndex, [r, g, b]) => {
    let x = 0
    for (let i = 0; i < bandIndex; i++) x += widths[i]
    const w = widths[bandIndex]
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    if (variant === 'wavy') {
      fillWavyVerticalBand(x, 0, w, canvas.height)
    } else {
      ctx.fillRect(x, 0, w, canvas.height)
    }
    if (edge) strokeEdge(x, 0, w, canvas.height)
  }

  // draw mirrored pairs (left/right)
  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    drawBandAtIndex(i, [r, g, b])
    const rightIndex = totalBands - 1 - i
    drawBandAtIndex(rightIndex, [r, g, b])
  }

  // center band
  const [cr, cg, cb] = getRandomColor(palette)
  const centerIndex = pairs
  drawBandAtIndex(centerIndex, [cr, cg, cb])

  return { type: 'symmetric-odd', bandsEachSide: n, bandWidths: widths, palette }
}

export default symmetricSolidRectanglesOdd
  
