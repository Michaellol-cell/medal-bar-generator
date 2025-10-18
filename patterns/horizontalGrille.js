/**
 * Enhanced horizontalGrille
 *
 * - Backwards compatible: call with just (canvas) and it behaves like your original.
 * - Optional second argument `opts` to customize:
 *    - start, step, thickness: spacing and sizes (numbers or functions)
 *    - odd / even: { shape: 'rect'|'line'|'circle'|'dash'|'triangle'|'rounded', color, alpha, patternWidth, jitter }
 *    - offsetX: horizontal offset to shift rows
 *    - seedRandom: boolean to give consistent jitter each frame (not cryptographic)
 *
 * Example usage:
 *   horizontalGrille(myCanvas, {
 *     step: Math.round(myCanvas.height / 18),
 *     thickness: Math.round(myCanvas.height / 36),
 *     odd: { shape: 'rect', color: 'rgba(0,0,0,0.18)' },
 *     even: { shape: 'dash', color: 'rgba(255,255,255,0.06)', patternWidth: 16 },
 *     offsetX: 6,
 *     jitter: 2
 *   })
 */
const horizontalGrille = (canvas, opts = {}) => {
  if (!canvas || !canvas.getContext) return
  const ctx = canvas.getContext('2d')

  // defaults (preserve original sizing unless overridden)
  const defaults = {
    // baseline spacing / sizes based on canvas
    start: Math.round(canvas.height / 64),
    step: Math.round(canvas.height / 16),
    thickness: Math.round(canvas.height / 32),
    // overall fallback color
    color: 'rgba(0, 0, 0, 0.25)',
    // odd / even row styles
    odd: { shape: 'rect', color: null, alpha: null, patternWidth: 0 },
    even: { shape: 'rect', color: null, alpha: null, patternWidth: 0 },
    offsetX: 0,
    jitter: 0, // max random jitter in px applied to shapes (0 = none)
    seedRandom: false // not used for cryptographic purposes; creates deterministic jitter if true
  }

  // shallow merge
  const cfg = Object.assign({}, defaults, opts)
  // ensure nested objects exist
  cfg.odd = Object.assign({}, defaults.odd, opts.odd || {})
  cfg.even = Object.assign({}, defaults.even, opts.even || {})

  // helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const rand = (n, seed) => {
    if (!cfg.jitter) return 0
    if (cfg.seedRandom && typeof seed === 'number') {
      // simple LCG for deterministic-ish sequence (not secure)
      const m = 0x80000000, a = 1103515245, c = 12345
      seed = (a * seed + c) % m
      return ((seed / m) * 2 - 1) * n
    }
    return (Math.random() * 2 - 1) * n
  }

  // convert thickness/step/start if user passed functions
  const resolve = (v, yIndex) => (typeof v === 'function' ? v(yIndex, canvas) : v)

  // shape drawing routines (all use ctx; they should not change globalAlpha without restoring)
  const drawRect = (x, y, w, h, color, alpha = 1) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
    ctx.restore()
  }

  const drawRoundedRect = (x, y, w, h, r, color, alpha = 1) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    const radius = Math.min(r, w / 2, h / 2)
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }

  const drawLine = (y, thickness, color, alpha = 1) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(0, y + thickness / 2)
    ctx.lineTo(canvas.width, y + thickness / 2)
    ctx.lineWidth = thickness
    ctx.lineCap = 'butt'
    ctx.strokeStyle = color
    ctx.stroke()
    ctx.restore()
  }

  const drawDash = (y, thickness, color, alpha = 1, dashLen = 12, gap = 8, offset = 0) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.setLineDash([dashLen, gap])
    ctx.lineWidth = thickness
    ctx.lineCap = 'butt'
    ctx.strokeStyle = color
    ctx.moveTo(-offset, y + thickness / 2)
    ctx.lineTo(canvas.width + offset, y + thickness / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  const drawCircles = (y, thickness, color, alpha = 1, spacing = null, jitterSeed = 0) => {
    const r = Math.max(1, Math.round(thickness / 2))
    spacing = spacing || r * 4
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    let x = 0
    let i = 0
    while (x < canvas.width) {
      const j = rand(cfg.jitter, jitterSeed + i) // small x jitter
      ctx.beginPath()
      ctx.arc(Math.round(x + cfg.offsetX + j), Math.round(y + r + j / 2), r, 0, Math.PI * 2)
      ctx.fill()
      x += spacing
      i++
    }
    ctx.restore()
  }

  const drawTriangles = (y, thickness, color, alpha = 1, base = null, jitterSeed = 0) => {
    base = base || thickness * 3
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    let x = 0
    let i = 0
    while (x < canvas.width + base) {
      const jx = rand(cfg.jitter, jitterSeed + i)
      const peakX = x + cfg.offsetX + jx
      ctx.beginPath()
      ctx.moveTo(peakX, y) // top
      ctx.lineTo(peakX - base / 2, y + thickness)
      ctx.lineTo(peakX + base / 2, y + thickness)
      ctx.closePath()
      ctx.fill()
      x += base
      i++
    }
    ctx.restore()
  }

  // map shape name -> draw routine
  const drawRow = (shape, y, thickness, style, idx) => {
    const color = style.color || cfg.color
    const alpha = style.alpha != null ? clamp(style.alpha, 0, 1) : (parseAlphaFromRgba(color) ?? 1)

    switch (shape) {
      case 'rounded':
        drawRoundedRect(cfg.offsetX + rand(cfg.jitter, idx), y + rand(cfg.jitter, idx), canvas.width - cfg.offsetX, thickness, Math.max(2, Math.round(thickness / 2)), color, alpha)
        break
      case 'line':
        drawLine(y + rand(cfg.jitter, idx), thickness, color, alpha)
        break
      case 'dash':
        drawDash(y, thickness, color, alpha, style.patternWidth || 12, style.gap || Math.round((style.patternWidth || 12) / 2), style.offset || 0)
        break
      case 'circle':
        drawCircles(y, thickness, color, alpha, style.patternWidth || Math.round(thickness * 3), idx)
        break
      case 'triangle':
        drawTriangles(y, thickness, color, alpha, style.patternWidth || Math.round(thickness * 3), idx)
        break
      case 'rect':
      default:
        drawRect(cfg.offsetX + rand(cfg.jitter, idx), y + rand(cfg.jitter, idx), canvas.width - cfg.offsetX, thickness, color, alpha)
        break
    }
  }

  // helper to extract alpha from 'rgba(...)' strings if present
  function parseAlphaFromRgba(s) {
    if (typeof s !== 'string') return null
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const parts = m[1].split(',').map(p => p.trim())
    if (parts.length === 4) return parseFloat(parts[3])
    return null
  }

  // main loop: iterate rows
  let rowIndex = 0
  for (let y = resolve(cfg.start, rowIndex); y < canvas.height; y += resolve(cfg.step, rowIndex)) {
    const thickness = Math.max(1, resolve(cfg.thickness, rowIndex))
    const isOdd = (rowIndex % 2) === 1
    const style = isOdd ? cfg.odd : cfg.even

    const shape = (style && style.shape) ? style.shape : 'rect'
    drawRow(shape, y, thickness, style, rowIndex)

    rowIndex++
    // safety: prevent infinite loops
    if (rowIndex > 10000) break
  }
}

export default horizontalGrille
      
