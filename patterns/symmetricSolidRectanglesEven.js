import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

/**
 * Even-only symmetric ribbons (pairs). Backwards-compatible:
 *  - symmetricSolidRectanglesEven(canvas, numberOfPairs)
 *  - symmetricSolidRectanglesEven(canvas, { numberOfPairs, jitter, edge, alpha, variant, seedless })
 *
 * New options (safe defaults preserve original behavior):
 *  - numberOfPairs: integer (overrides second-arg number)
 *  - jitter: number (px) default 0 — jitter each band's width by ±jitter (then normalize)
 *  - edge: boolean default false — draw subtle stroke around bands
 *  - alpha: number (0..1) default 1 — opacity for fills
 *  - variant: 'solid'|'wavy' default 'solid'
 *  - seedless: boolean default false — use Math.random instead of prng()
 */
const symmetricSolidRectanglesEven = (canvas, numberOfPairsOrOptions) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Normalize arguments: keep backwards compatibility with numeric second arg
  let options = {}
  if (typeof numberOfPairsOrOptions === 'number') {
    options.numberOfPairs = Math.floor(numberOfPairsOrOptions)
  } else if (typeof numberOfPairsOrOptions === 'object' && numberOfPairsOrOptions !== null) {
    options = numberOfPairsOrOptions
  }

  const {
    numberOfPairs,           // optional override
    jitter = 0,              // px jitter applied to band widths (default 0)
    edge = false,            // default original had no stroke
    alpha = 1,               // original behavior used full opacity
    variant = 'solid',       // 'solid' | 'wavy'
    seedless = false,        // false -> use prng(), true -> Math.random()
  } = options

  const rnd = seedless ? Math.random : prng
  const randBetween = (a, b) => a + (b - a) * rnd()
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

  // numberOfPairs fallback preserved exactly as original when not supplied
  const pairs = (typeof numberOfPairs === 'number' && numberOfPairs > 0)
    ? Math.floor(numberOfPairs)
    : Math.max(1, Math.floor(2 + prng() * 4)) // preserve original default (2..5 by prng)

  const totalBands = pairs * 2

  // integer distribution across totalBands (preserve original approach)
  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  let widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  // apply jitter if requested, then normalize widths so sum === canvas.width
  if (jitter && jitter > 0) {
    // apply symmetric-ish jitter per band (can break perfect mirroring as original did)
    const widthsFloat = widths.map(w => w + randBetween(-jitter, jitter))
    // avoid tiny/negative values
    for (let i = 0; i < widthsFloat.length; i++) widthsFloat[i] = Math.max(1, widthsFloat[i])

    // scale to match canvas.width
    const floatSum = widthsFloat.reduce((s, v) => s + v, 0)
    const scale = canvas.width / floatSum
    let scaled = widthsFloat.map(v => v * scale)

    // integerize while preserving total by distributing remainder
    let intWidths = scaled.map(v => Math.floor(v))
    let diff = canvas.width - intWidths.reduce((s, v) => s + v, 0)
    // distribute +1 across indices (left-to-right) until diff exhausted
    for (let k = 0; diff > 0; k++, diff--) {
      intWidths[k % intWidths.length]++
    }
    // if somehow negative diff (shouldn't happen), reduce some
    for (let k = 0; diff < 0; k++, diff++) {
      const idx = k % intWidths.length
      if (intWidths[idx] > 1) intWidths[idx]--
    }
    widths = intWidths
  }

  // prepare palette
  const palette = selectPalette(Math.max(3, totalBands))

  // helper stroke function (subtle edge)
  const strokeEdge = (x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(w, h) * 0.04)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * rnd())})`
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
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

  // DRAW mirrored pairs (preserve the original logic of using widths[] and mirrored indices)
  for (let i = 0; i < pairs; i++) {
    // left index = i
    const [r, g, b] = getRandomColor(palette)

    // compute xLeft by summing widths[0..i-1]
    let xLeft = 0
    for (let j = 0; j < i; j++) xLeft += widths[j]
    const wLeft = widths[i]
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

    if (variant === 'wavy') {
      fillWavyVerticalBand(xLeft, 0, wLeft, canvas.height)
    } else {
      ctx.fillRect(xLeft, 0, wLeft, canvas.height)
    }
    if (edge) strokeEdge(xLeft, 0, wLeft, canvas.height)

    // right index = totalBands - 1 - i
    const rightIndex = totalBands - 1 - i
    let xRight = 0
    for (let j = 0; j < rightIndex; j++) xRight += widths[j]
    const wRight = widths[rightIndex]
    // use same color for the mirrored partner (keeps pair visually coherent as before)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    if (variant === 'wavy') {
      fillWavyVerticalBand(xRight, 0, wRight, canvas.height)
    } else {
      ctx.fillRect(xRight, 0, wRight, canvas.height)
    }
    if (edge) strokeEdge(xRight, 0, wRight, canvas.height)
  }

  return { type: 'symmetric-even', pairs, bandWidths: widths, palette }
}

export default symmetricSolidRectanglesEven
      
