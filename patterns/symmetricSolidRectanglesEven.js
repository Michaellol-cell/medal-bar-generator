import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const symmetricSolidRectanglesEven = (canvas, numberOfPairs) => {
  const ctx = canvas.getContext('2d')

  // numberOfPairs = how many columns per side. Total bands = pairs * 2
  const pairs = (typeof numberOfPairs === 'number' && numberOfPairs > 0)
    ? Math.floor(numberOfPairs)
    : Math.max(1, Math.floor(2 + prng() * 4)) // default 2..5

  const totalBands = pairs * 2
  const bandWidth = Math.floor(canvas.width / totalBands) || 1
  const palette = selectPalette(Math.max(3, totalBands))

  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    const xLeft = i * bandWidth
    const xRight = canvas.width - (i + 1) * bandWidth

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, bandWidth, canvas.height)
    ctx.fillRect(xRight, 0, bandWidth, canvas.height)
  }

  // Optional: handle leftover pixels (canvas.width - bandWidth*totalBands)
  // For simplicity we leave the tiny remainder as a gap; you can center/stretch if needed.

  return { type: 'symmetric-even', pairs, bandWidth }
}

export default symmetricSolidRectanglesEven
