import { 
  goldenFrame, 
  silverFrame, 
  horizontalGrille, 
  verticalGrille, 
  gridGrille, 
  diagonalGrille, 
  devices 
} from './patterns/index.js'
import prng from './prng/index.js'

const createBarCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', 140)
  canvas.setAttribute('height', 38)
  canvas.classList.add('bar')
  document.body.appendChild(canvas)
  return canvas
}

const clearCanvas = canvas => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// paintBar returns a function that paints a bar; keeps same signature you had
const paintBar = pattern => ({ canvas, numberOfRectangles } = {}) => {
  canvas = canvas || createBarCanvas()

  clearCanvas(canvas)

  // draw the main pattern (keeps the same call you already used)
  pattern(canvas, numberOfRectangles)

  // always add the horizontal grille
  horizontalGrille(canvas)

  // add one extra grille variant sometimes, for variety
  const choice = prng() // 0..1
  if (choice <= 0.18) {
    // small chance to add vertical bars
    verticalGrille(canvas)
  } else if (choice <= 0.36) {
    // another small chance to add a grid (crosshatch)
    gridGrille(canvas)
  } else if (choice <= 0.54) {
    // diagonal for drama
    diagonalGrille(canvas)
  }
  // else: no extra grille — keep only horizontal

  // frames and devices (unchanged probabilities from your code)
  if (prng() <= 0.1) {
    goldenFrame(canvas)
  }

  if (prng() <= 0.1) {
    silverFrame(canvas)
  }

  if (prng() <= 0.3) {
    devices(canvas)
  }
}

export default paintBar
