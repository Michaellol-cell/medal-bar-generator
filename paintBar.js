// paintBar.js
// patterns/index.js
export { default as goldenFrame } from './patterns/goldenFrame.js'
export { default as silverFrame } from './patterns/silverFrame.js'
export { default as horizontalGrille } from '.0patterns/horizontalGrille.js'
export { default as verticalGrille } from './patterns/verticalGrille.js'
export { default as gridGrille } from './patterns/gridGrille.js'
export { default as diagonalGrille } from './patterns/diagonalGrille.js'
export { default as devices } from './patterns/devices.js'

// also export other patterns you already had, e.g. rectangles/palettes etc.
// export { default as randomSolidRectangles } from './randomSolidRectangles.js'
// ...

import prng from './prng/index.js'

/**
 * Create a new bar canvas and append to body (mirrors your original behavior).
 * Keeps fixed pixel dimensions like your original file.
 */
const createBarCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', 140)
  canvas.setAttribute('height', 38)
  canvas.classList.add('bar')
  document.body.appendChild(canvas)
  return canvas
}

/** Clear the entire canvas */
const clearCanvas = canvas => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

/** Map of named grilles for easy lookup */
const grilleMap = {
  horizontal: horizontalGrille,
  vertical: verticalGrille,
  grid: gridGrille,
  diagonal: diagonalGrille
}

/**
 * Choose a grille function by name or randomly.
 * - grilleOption may be:
 *    - 'random' (default) => pick one at random
 *    - 'horizontal' | 'vertical' | 'grid' | 'diagonal' => use that exact grille
 *    - 'none' => do not apply any grille
 */
const pickGrille = (grilleOption = 'random') => {
  if (grilleOption === 'none') return null
  if (grilleOption === 'random') {
    const grilles = Object.values(grilleMap)
    return grilles[Math.floor(prng() * grilles.length)]
  }
  return grilleMap[grilleOption] || null
}

/**
 * paintBar
 * - pattern: function(canvas, numberOfRectangles) { ... }  (same as your existing API)
 * - options: { canvas, numberOfRectangles, grille, goldenChance, silverChance, devicesChance }
 *
 * Default behaviour preserves your original flow:
 * 1) create/clear canvas
 * 2) draw base pattern
 * 3) apply chosen grille (or random)
 * 4) maybe draw gold/silver frames and devices overlay based on RNG chances
 */
const paintBar = pattern => ({
  canvas,
  numberOfRectangles,
  grille = 'random',           // 'random' | 'horizontal' | 'vertical' | 'grid' | 'diagonal' | 'none'
  goldenChance = 0.1,
  silverChance = 0.1,
  devicesChance = 0.3
} = {}) => {
  // ensure canvas exists
  canvas = canvas || createBarCanvas()

  // defensive: pattern must be a function
  if (typeof pattern !== 'function') {
    throw new TypeError('paintBar expects pattern to be a function (canvas, numberOfRectangles) => {}')
  }

  // clear previous pixels
  clearCanvas(canvas)

  // draw the core pattern
  pattern(canvas, numberOfRectangles)

  // choose and apply grille (if any)
  const grilleFunc = pickGrille(grille)
  if (typeof grilleFunc === 'function') {
    grilleFunc(canvas)
  }

  // frames & devices (probabilistic)
  if (prng() <= goldenChance) {
    goldenFrame(canvas)
  }

  if (prng() <= silverChance) {
    silverFrame(canvas)
  }

  if (prng() <= devicesChance) {
    devices(canvas)
  }

  // return the canvas for convenience (useful in tests or chaining)
  return canvas
}

export default paintBar
    
