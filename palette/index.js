// color-oklab-palette.js
// Uses your deterministic prng() to sample OKLab/OKLCh and convert to sRGB 0..255
// Install Color.js (npm): `npm i colorjs.io`
// Or use CDN in a browser module: `import Color from "https://colorjs.io/dist/color.js";`

import prng from '../prng/index.js'
import Color from 'colorjs.io/src/color.js' // good for bundlers; or 'colorjs.io' / CDN as above

// OKLab documented coordinate ranges in Color.js:
//  L: 0..1, a: -0.4..0.4, b: -0.4..0.4
// See Color.js spaces docs for OKLab/OKLCh. :contentReference[oaicite:3]{index=3}

const rand = (min, max) => min + prng() * (max - min)

const clamp01 = v => Math.min(1, Math.max(0, v))
const srgbCoordsTo255 = (coords) => coords.map(c => Math.round(clamp01(c) * 255))

// --- Simple OKLab sampler (may produce out-of-gamut colors; we map them below) ---
export const randomOKLab = ({mapTo = 'srgb', gamutMap = true} = {}) => {
  const L = rand(0, 1)
  const a = rand(-0.4, 0.4)
  const b = rand(-0.4, 0.4)

  let col = new Color('oklab', [L, a, b])

  if (gamutMap) {
    // map into the target gamut (mutates clone) — safer than naive clipping.
    col = col.clone().toGamut({space: mapTo})
  }

  const out = col.to(mapTo) // e.g. "srgb"
  return srgbCoordsTo255(out.coords)
}

// --- Better: sample in OKLCh for controlled chroma & hue (prettier palettes) ---
export const randomOKLCh = ({LRange = [0.15, 0.85], cMax = 0.32, mapTo = 'srgb', gamutMap = true} = {}) => {
  // L: avoid extremes by default (too close to black or white). cMax is a conservative safe chroma.
  const L = rand(LRange[0], LRange[1])
  const C = prng() * cMax // linear chroma; you can bias distribution by Math.pow(prng(), 0.6) to favor lower chroma
  const h = rand(0, 360)

  let col = new Color('oklch', [L, C, h])

  if (gamutMap) col = col.clone().toGamut({space: mapTo})

  const out = col.to(mapTo)
  return srgbCoordsTo255(out.coords)
}

// --- API replacements to match your existing calls ---
// selectPalette(size) -> returns array of [r,g,b]
export const selectPalette = (size, {mode = 'oklch', options = {}} = {}) => {
  const palette = []
  for (let i = 0; i < size; i++) {
    if (mode === 'oklab') palette.push(randomOKLab(options))
    else palette.push(randomOKLCh(options)) // default to OKLCh (more artist-friendly)
  }
  return palette
}

// getRandomColor(palette) -> if palette provided pick from it, else sample from OKLCh
export const getRandomColor = (palette) => {
  if (!palette || palette.length === 0) return randomOKLCh()
  return palette[Math.trunc(prng() * palette.length)]
}
