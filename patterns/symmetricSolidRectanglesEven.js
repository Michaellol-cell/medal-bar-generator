import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const symmetricSolidRectanglesEven = (canvas, numberOfPairs) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // numberOfPairs = how many columns per side. Total bands = pairs * 2
  const pairs = (typeof numberOfPairs === 'number' && numberOfPairs > 0)
    ? Math.floor(numberOfPairs)
    : Math.max(1, Math.floor(2 + prng() * 4)) // default 2..5

  const totalBands = pairs * 2

  // integer distribution: ensure sum(widths) === canvas.width
  const base = Math.floor(canvas.width / totalBands) || 1
  const remainder = canvas.width - base * totalBands
  const widths = new Array(totalBands).fill(base)
  for (let i = 0; i < remainder; i++) widths[i]++

  const palette = selectPalette(Math.max(3, totalBands))

  // draw mirrored pairs using integer positions
  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    // left index = i
    let xLeft = 0
    for (let j = 0; j < i; j++) xLeft += widths[j]
    const wLeft = widths[i]
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, wLeft, canvas.height)

    // right index = totalBands - 1 - i
    let rightIndex = totalBands - 1 - i
    let xRight = 0
    for (let j = 0; j < rightIndex; j++) xRight += widths[j]
    const wRight = widths[rightIndex]
    ctx.fillRect(xRight, 0, wRight, canvas.height)
  }

  // Note: previously you left remainder pixels 'as a gap' — now widths[] accounts for remainder.
  return { type: 'symmetric-even', pairs, bandWidths: widths }
}

export default symmetricSolidRectanglesEven
      
