import { goldenFrame, silverFrame, horizontalGrille, verticalGrille, diagonalGrille, gridGrille, devices } from './patterns/index.js'
import prng from './prng/index.js'

/**
 * createBarCanvas(w = 140, h = 38)
 * Creates a canvas element sized in CSS pixels and scales it for devicePixelRatio
 * so drawings stay crisp on high-DPI displays.
 */
const createBarCanvas = (w = 140, h = 38) => {
  const canvas = document.createElement('canvas')

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  canvas.classList.add('bar')
  document.body.appendChild(canvas)
  return canvas
}

/**
 * Clears the canvas in CSS pixel space. Works whether or not the context
 * has been scaled for DPR.
 */
const clearCanvas = canvas => {
  const dpr = window.devicePixelRatio || 1
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
}

// Available grille functions (kept in an array for random selection)
const grilleOptions = [horizontalGrille, verticalGrille, gridGrille, diagonalGrille]

/**
 * paintBar(pattern, opts)
 * pattern: function(canvas, numberOfRectangles) - draws the base pattern
 * opts (optional): {
 *   canvas,                 // existing canvas to draw onto (created if missing)
 *   numberOfRectangles,     // forwarded to pattern
 *   width, height,          // CSS pixel size when creating a new canvas
 *   grille: 'auto'|'random'|'horizontal'|'vertical'|'grid'|'diagonal'|null,
 *   frames: { goldChance, silverChance, devicesChance },
 *   mutuallyExclusiveFrames: boolean (default true) - whether gold/silver exclude each other
 * }
 */
const paintBar = (pattern, opts = {}) => {
  const {
    canvas,
    numberOfRectangles,
    width = 140,
    height = 38,
    grille = 'auto',
    frames = {},
    mutuallyExclusiveFrames = true
  } = opts

  const cvs = canvas || createBarCanvas(width, height)

  clearCanvas(cvs)

  // Draw base pattern first
  pattern(cvs, numberOfRectangles)

  // Decide whether to draw a grille overlay
  const grilleChoice = (() => {
    if (grille === null) return null
    if (grille === 'auto') return 'random'
    return grille
  })()

  if (grilleChoice === 'random') {
    // pick a grille function at random and call it
    const pickIndex = Math.floor(prng() * grilleOptions.length)
    grilleOptions[pickIndex](cvs)
  } else if (typeof grilleChoice === 'string') {
    switch (grilleChoice) {
      case 'horizontal': horizontalGrille(cvs); break
      case 'vertical': verticalGrille(cvs); break
      case 'grid': gridGrille(cvs); break
      case 'diagonal': diagonalGrille(cvs); break
      default: horizontalGrille(cvs)
    }
  }

  // Single set of random draws for all decorations (keeps behavior consistent per-bar)
  const r1 = prng()
  const r2 = prng()
  const r3 = prng()

  const goldChance = typeof frames.goldChance === 'number' ? frames.goldChance : 0.1
  const silverChance = typeof frames.silverChance === 'number' ? frames.silverChance : 0.1
  const devicesChance = typeof frames.devicesChance === 'number' ? frames.devicesChance : 0.3

  if (mutuallyExclusiveFrames) {
    if (r1 <= goldChance) {
      goldenFrame(cvs)
    } else if (r2 <= silverChance) {
      silverFrame(cvs)
    }
  } else {
    if (r1 <= goldChance) goldenFrame(cvs)
    if (r2 <= silverChance) silverFrame(cvs)
  }

  if (r3 <= devicesChance) {
    devices(cvs)
  }
}

export default paintBar
