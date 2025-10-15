// symmetricSolidRectanglesOdd.js
import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const clamp01 = v => Math.max(0, Math.min(1, v))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const normalizeTo8Bit = (col) => {
  if (!Array.isArray(col) || col.length < 3) return [0,0,0]
  return col.slice(0,3).map((v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    if (n >= 0 && n <= 1) return Math.round(clamp01(n)*255)
    if (n > 1 && n <= 255) return Math.round(n)
    if (n > 255 && n <= 65535) return Math.round(clamp(n / 65535, 0, 1) * 255)
    return Math.round(clamp(n, 0, 255))
  })
}

const symmetricSolidRectanglesOdd = (canvas, bandsEachSide = undefined) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const n = (typeof bandsEachSide === 'number' && bandsEachSide > 0)
    ? Math.floor(bandsEachSide)
    : Math.max(2, Math.floor(2 + prng() * 3)) // => totalBands 3..7

  const pairs = n - 1
  const totalBands = 2 * n - 1

  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  const widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  const rawPalette = selectPalette(Math.max(3, totalBands))
  const palette = rawPalette.map(normalizeTo8Bit)

  const drawBandAtIndex = (bandIndex, col) => {
    let x = 0
    for (let i = 0; i < bandIndex; i++) x += widths[i]
    const w = widths[bandIndex]
    const [r, g, b] = normalizeTo8Bit(col)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(x, 0, w, canvas.height)
  }

  for (let i = 0; i < pairs; i++) {
    const color = palette[Math.floor(prng() * palette.length)]
    drawBandAtIndex(i, color)
    const rightIndex = totalBands - 1 - i
    drawBandAtIndex(rightIndex, color)
  }

  // center band
  const centerColor = palette[Math.floor(prng() * palette.length)]
  const centerIndex = pairs
  drawBandAtIndex(centerIndex, centerColor)

  // stroke helper (optional)
  const drawStroke = () => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(canvas.width / totalBands, canvas.height) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`
    let x = 0
    for (let i = 0; i < totalBands; i++) {
      const w = widths[i]
      ctx.strokeRect(x + 0.5, 0.5, Math.max(0, w - 1), Math.max(0, canvas.height - 1))
      x += w
    }
    ctx.restore()
  }

  // comment: do not stroke by default; caller may call drawStroke if desired

  return { type: 'symmetric-odd', bandsEachSide: n, bandWidths: widths }
}

export default symmetricSolidRectanglesOdd
