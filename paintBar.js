import { goldenFrame, silverFrame, horizontalGrille, verticalGrille, gridGrille, diagonalGrille, devices } from './patterns/index.js'
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

/**
 * Choose a grille type based on weighted probabilities.
 * Adjust these weights to taste. They should sum to 1 (not required, we normalize).
 */
const pickGrille = () => {
  const weights = {
    horizontal: 0.5,
    vertical:   0.2,
    grid:       0.2,
    diagonal:   0.1
  }

  // normalize and pick
  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  let r = prng() * total
  for (const [key, w] of Object.entries(weights)) {
    if (r <= w) return key
    r -= w
  }
  return 'horizontal'
}

const paintBar = pattern => ({ canvas, numberOfRectangles } = {}) => {
  canvas = canvas || createBarCanvas()

  clearCanvas(canvas)

  // base pattern (your existing pattern function)
  pattern(canvas, numberOfRectangles)

  // probabilistic grille selection (replaces the always-horizontal behaviour)
  const grilleType = pickGrille()
  switch (grilleType) {
    case 'vertical':
      verticalGrille(canvas)
      break
    case 'grid':
      gridGrille(canvas)
      break
    case 'diagonal':
      diagonalGrille(canvas)
      break
    case 'horizontal':
    default:
      horizontalGrille(canvas)
      break
  }

  // frames / devices (kept your original chances)
  if (prng() <= 0.1) {
    goldenFrame(canvas)
  }

  if (prng() <= 0.1) { // or a different chance for silver
    silverFrame(canvas)
  }

  if (prng() <= 0.3) {
    devices(canvas)
  }
}

export default paintBar
