// color-oklch-prophoto.js
import prng from '../prng/index.js'
import Color from 'colorjs.io' // or 'colorjs.io/dist/color.js' for some bundlers

const rand = (min, max) => min + prng() * (max - min)
const clamp01 = v => Math.max(0, Math.min(1, v))

/**
 * Sample a single OKLCh color and convert -> ProPhoto RGB.
 * 
 * options:
 *  - LRange: [minL, maxL] (default [0.12, 0.9])
 *  - cMax: conservative chroma ceiling (default 0.45) — increase if you know your target device supports it
 *  - gamutMap: true|false (default true). When true, will map out-of-gamut OKLab colors into prophoto-rgb.
 *  - as16bit: return 0..65535 integers when true; otherwise returns normalized floats 0..1
 */
export const randomOKLChToProPhoto = ({
  LRange = [0.12, 0.88],
  cMax = 0.45,
  gamutMap = true,
  as16bit = false,
} = {}) => {
  const L = rand(LRange[0], LRange[1])
  // bias chroma distribution slightly towards lower values for more usable colors:
  const C = Math.pow(prng(), 0.9) * cMax
  const h = rand(0, 360)

  // create OKLCH color
  let col = new Color('oklch', [L, C, h])

  // optionally map into prophoto-rgb gamut (recommended)
  if (gamutMap) {
    // toGamut mutates the color; pass the target space name
    col = col.clone().toGamut({space: 'prophoto-rgb'})
  }

  // convert to prophoto-rgb coordinates
  const out = col.to('prophoto-rgb')
  const coords = out.coords.map(clamp01) // ensure safe range [0..1]

  if (as16bit) return coords.map(c => Math.round(c * 65535))
  return coords // [r,g,b] floats 0..1
}

/**
 * selectPalette(size, opts) -> returns array of prophoto colors
 * opts forwarded to randomOKLChToProPhoto
 */
export const selectPalette = (size, opts = {}) => {
  const palette = new Array(size)
  for (let i = 0; i < size; i++) {
    palette[i] = randomOKLChToProPhoto(opts)
  }
  return palette
}

/**
 * getRandomColor(palette, opts) -> if palette provided, pick deterministic entry,
 * otherwise sample a fresh OKLCh -> ProPhoto color.
 *
 * If you want sRGB for display, convert the chosen color using Color.js:
 *   new Color('prophoto-rgb', coords).to('srgb')
 */
export const getRandomColor = (palette, opts = {}) => {
  if (!palette || palette.length === 0) return randomOKLChToProPhoto(opts)
  return palette[Math.trunc(prng() * palette.length)]
      }
