import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'
import Color from 'colorjs.io'

// Convert ProPhoto RGB [0-1 floats] to sRGB [0-255 integers] for canvas
const prophotoToSRGB = ([r, g, b]) => {
  const col = new Color('prophoto-rgb', [r, g, b])
  const srgb = col.to('srgb').coords
  return srgb.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255))
}

/**
 * Draw symmetric vertical bands (even count) with mirrored colors
 * 
 * @param {HTMLCanvasElement} canvas - The target canvas
 * @param {number} numberOfPairs - Number of mirrored pairs (total bands = pairs * 2)
 * @param {object} paletteOpts - Options to pass to selectPalette (LRange, cMax, etc.)
 */
const symmetricSolidRectanglesEven = (canvas, numberOfPairs, paletteOpts = {}) => {
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

  // Get ProPhoto colors and convert to sRGB
  const prophotoColors = selectPalette(Math.max(3, totalBands), paletteOpts)
  const palette = prophotoColors.map(prophotoToSRGB)

  // draw mirrored pairs using integer positions
  for (let i = 0; i < pairs; i++) {
    const prophotoColor = getRandomColor(prophotoColors, paletteOpts)
    const [r, g, b] = prophotoToSRGB(prophotoColor)
    
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

  return { type: 'symmetric-even', pairs, bandWidths: widths }
}

export default symmetricSolidRectanglesEven
