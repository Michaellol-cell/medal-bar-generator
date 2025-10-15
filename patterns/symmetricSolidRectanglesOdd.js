import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const symmetricSolidRectanglesOdd = (canvas, bandsEachSide = undefined) => {
  const ctx = canvas.getContext('2d')

  // clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // bandsEachSide = number of bands on *one side including the center*.
  // totalBands = 2 * bandsEachSide - 1 (odd)
  const n = (typeof bandsEachSide === 'number' && bandsEachSide > 0)
    ? Math.floor(bandsEachSide)
    : Math.max(2, Math.floor(2 + prng() * 3)) // default 2..4 (=> total 3..7)

  const pairs = n - 1
  const totalBands = 2 * n - 1

  // Compute integer widths that sum exactly to canvas.width
  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  // distribute the remainder one pixel at a time into the first `remainder` bands
  const widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  const palette = selectPalette(Math.max(3, totalBands))

  // helper to draw a vertical band by absolute band index (0..totalBands-1)
  const drawBandAtIndex = (bandIndex, [r, g, b]) => {
    // compute x by summing widths up to bandIndex
    let x = 0
    for (let i = 0; i < bandIndex; i++) x += widths[i]
    const w = widths[bandIndex]

    // fill - use integer x/w to avoid subpixel seams; add 0.0 overlap safety if you want:
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(x, 0, w, canvas.height)
  }

  // draw mirrored pairs
  // left indices 0..pairs-1, right indices totalBands-1 .. totalBands-pairs
  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    // left band index is i
    drawBandAtIndex(i, [r, g, b])
    // right mirror index
    const rightIndex = totalBands - 1 - i
    drawBandAtIndex(rightIndex, [r, g, b])
  }

  // single center band (the middle index)
  const [cr, cg, cb] = getRandomColor(palette)
  const centerIndex = pairs
  drawBandAtIndex(centerIndex, [cr, cg, cb])

  // optional: draw subtle strokes inside band edges (no fractional coords)
  // draw strokes after fills to avoid gaps caused by stroked pixels being half-pixel aliased
  const drawStroke = () => {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.lineWidth = Math.max(1, Math.min(4, Math.round(Math.min(canvas.width / totalBands, canvas.height) * 0.05)))
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.22, 0.06 + 0.03 * prng())})`

    // stroke each band with its interior rectangle to avoid adding pixels between bands
    let x = 0
    for (let i = 0; i < totalBands; i++) {
      const w = widths[i]
      // inset stroke by 0.5 so stroke pixels fall inside the filled rectangle and do not create seams
      ctx.strokeRect(x + 0.5, 0.5, Math.max(0, w - 1), Math.max(0, canvas.height - 1))
      x += w
    }
    ctx.restore()
  }

  // If you want edges, call drawStroke(true) from caller or uncomment:
  // drawStroke()

  return { type: 'symmetric-odd', bandsEachSide: n, bandWidths: widths }
}

export default symmetricSolidRectanglesOdd
