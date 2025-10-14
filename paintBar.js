import { goldenFrame, silverFrame, horizontalGrille, verticalGrille, devices } from './patterns/index.js'
import prng from './prng/index.js'

const BASE_W = 140
const BASE_H = 38

// create canvas with devicePixelRatio handling and return it
const createBarCanvas = () => {
  const width = BASE_W
  const height = BASE_H
  const dpr = window.devicePixelRatio || 1

  const canvas = document.createElement('canvas')
  // set the backing store size
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  // set the CSS size
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  canvas.classList.add('bar')
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  // set an explicit transform so drawing code can use CSS pixel coordinates
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return canvas
}

// helper: logical (CSS) width/height from canvas
const logicalSize = canvas => {
  // if canvas.clientWidth is available use it (CSS px), otherwise derive from backing buffer
  const w = canvas.clientWidth || (canvas.width / (window.devicePixelRatio || 1))
  const h = canvas.clientHeight || (canvas.height / (window.devicePixelRatio || 1))
  return { w, h }
}

const clearCanvas = canvas => {
  const ctx = canvas.getContext('2d')
  // ctx is already transformed to CSS pixels in createBarCanvas
  const { w, h } = logicalSize(canvas)
  ctx.clearRect(0, 0, w, h)
}

// paintBar accepts either a single pattern function or an array of pattern functions.
// Each pattern is called with (canvas, numberOfRectangles)
const paintBar = pattern => ({ canvas, numberOfRectangles } = {}) => {
  canvas = canvas || createBarCanvas()

  clearCanvas(canvas)

  // helper to apply a pattern if it's a function
  const apply = pat => {
    if (!pat) return
    if (typeof pat === 'function') pat(canvas, numberOfRectangles)
  }

  if (Array.isArray(pattern)) {
    pattern.forEach(apply)
  } else {
    apply(pattern)
  }

  // overlay: horizontal grille (you can move this up/down depending on desired layering)
  horizontalGrille(canvas)

  // frames and devices with probabilities
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
  
