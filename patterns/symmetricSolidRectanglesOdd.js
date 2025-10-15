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

const symmetricSolidRectanglesOdd = (canvas, bandsEachSide = undefined) => {
  const ctx = canvas.getContext('2d')

  const n = (typeof bandsEachSide === 'number' && bandsEachSide > 0)
    ? Math.floor(bandsEachSide)
    : Math.max(2, Math.floor(2 + prng() * 3))

  const pairs = n - 1
  const totalBands = 2 * n - 1
  // distribute widths so they sum exactly to canvas.width
  const widths = distribute(canvas.width, totalBands)
  const starts = prefixPositions(widths)

  const palette = selectPalette(Math.max(3, totalBands))

  // mirrored pairs
  for (let i = 0; i < pairs; i++) {
    const [r, g, b] = getRandomColor(palette)
    const xLeft = starts[i]
    const wLeft = widths[i]

    const rightIndex = totalBands - 1 - i
    const xRight = starts[rightIndex]
    const wRight = widths[rightIndex]

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(xLeft, 0, wLeft, canvas.height)
    ctx.fillRect(xRight, 0, wRight, canvas.height)
  }

  // single center band (draw once)
  const [cr, cg, cb] = getRandomColor(palette)
  const centerIndex = pairs
  ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 1)`
  ctx.fillRect(starts[centerIndex], 0, widths[centerIndex], canvas.height)

  return { type: 'symmetric-odd', bandsEachSide: n, bandWidth: widths[0] }
}

export default symmetricSolidRectanglesOdd
