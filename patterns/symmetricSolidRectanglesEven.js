import { getRandomColor, selectPalette } from '../palette/index.js'
import prng from '../prng/index.js'

const distribute = (total, count) => {
  const base = Math.floor(total / count);
  const rem = total - base * count;
  const arr = new Array(count).fill(base);
  for (let i = 0; i < rem; i++) arr[i] += 1;
  return arr;
};

const prefixPositions = (sizes) => {
  const pos = new Array(sizes.length);
  let acc = 0;
  for (let i = 0; i < sizes.length; i++) {
    pos[i] = acc;
    acc += sizes[i];
  }
  return pos;
};

const symmetricSolidRectanglesEven = (canvas, numberOfPairs) => {
  const ctx = canvas.getContext('2d')

  const pairs = (typeof numberOfPairs === 'number' && numberOfPairs > 0)
    ? Math.floor(numberOfPairs)
    : Math.max(1, Math.floor(2 + prng() * 4))

  const totalBands = pairs * 2
  // distribute widths to exactly fill the canvas
  const widths = distribute(canvas.width, totalBands)
  const starts = prefixPositions(widths)

  const palette = selectPalette(Math.max(3, totalBands))

  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    const leftIndex = i
    const rightIndex = totalBands - 1 - i

    const xLeft = starts[leftIndex]
    const wLeft = widths[leftIndex]
    const xRight = starts[rightIndex]
    const wRight = widths[rightIndex]

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, wLeft, canvas.height)
    ctx.fillRect(xRight, 0, wRight, canvas.height)
  }

  return { type: 'symmetric-even', pairs, bandWidth: widths[0] }
}

export default symmetricSolidRectanglesEven
    
