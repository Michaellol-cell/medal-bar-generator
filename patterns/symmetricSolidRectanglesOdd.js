import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const symmetricSolidRectanglesOdd = (canvas, bandsEachSide = undefined) => {
  const ctx = canvas.getContext('2d')

  // bandsEachSide = number of bands on *one side including the center*.
  // totalBands = 2 * bandsEachSide - 1 (odd)
  const n = (typeof bandsEachSide === 'number' && bandsEachSide > 0)
    ? Math.floor(bandsEachSide)
    : Math.max(2, Math.floor(2 + prng() * 3)) // default 2..4 (=> total 3..7)

  const pairs = n - 1
  const totalBands = 2 * n - 1
  const bandWidth = Math.floor(canvas.width / totalBands) || 1
  const palette = selectPalette(Math.max(3, totalBands))

  // mirrored pairs
  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    const xLeft = i * bandWidth
    const xRight = canvas.width - (i + 1) * bandWidth

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, bandWidth, canvas.height)
    ctx.fillRect(xRight, 0, bandWidth, canvas.height)
  }

  // single center band (draw once)
  const [cr, cg, cb] = getRandomColor(palette)
  const centerX = pairs * bandWidth
  ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 1)`
  ctx.fillRect(centerX, 0, bandWidth, canvas.height)

  return { type: 'symmetric-odd', bandsEachSide: n, bandWidth }
}

export default symmetricSolidRectanglesOdd
    
