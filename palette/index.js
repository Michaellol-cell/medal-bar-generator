// ../palette/index.js
import prng from '../prng/index.js'

// constants
const MAX_48_INDEX = 256 ** 6       // 2^48

// produce a single random 48-bit index (Number; max ~2^48-1)
export const random48Index = () => Math.floor(prng() * MAX_48_INDEX)

// decode a 48-bit index to 3 channels of 16-bit depth [0..65535]
export const colorFrom48Index = (index) => {
  index = Math.max(0, Math.min(Math.floor(index), MAX_48_INDEX - 1))
  // R = high 16 bits, G = mid 16, B = low 16
  const r = Math.floor(index / (256 ** 4)) % 65536
  const g = Math.floor(index / (256 ** 2)) % 65536
  const b = index % 65536
  return [r, g, b]  // 16-bit channels
}

// convert a 16-bit-per-channel color to standard 8-bit [0..255]
export const color16To8 = ([r16, g16, b16]) => {
  const r8 = Math.round(Math.max(0, Math.min(65535, r16)) / 257)
  const g8 = Math.round(Math.max(0, Math.min(65535, g16)) / 257)
  const b8 = Math.round(Math.max(0, Math.min(65535, b16)) / 257)
  return [r8, g8, b8]
}

// hex helper for display (safe rounding/clamping)
export const rgb8ToHex = (rgb) => {
  const [r, g, b] = rgb.map(v => {
    const n = Math.round(Number(v) || 0)
    return Math.max(0, Math.min(255, n))
  })
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// convenience: random 48-bit color, returned both as 16-bit and as displayable 8-bit hex
export const random48ColorSample = () => {
  const idx = random48Index()
  const [r16, g16, b16] = colorFrom48Index(idx)
  const rgb8 = color16To8([r16, g16, b16])
  return { idx, color16: [r16, g16, b16], color8: rgb8, hex: rgb8ToHex(rgb8) }
}

// getRandomColor(palette) — if palette supplied, pick from it, otherwise return a random RGB [r,g,b]
export const getRandomColor = (palette) => {
  if (Array.isArray(palette) && palette.length > 0) {
    return palette[Math.floor(prng() * palette.length)]
  }
  // no palette -> sample full 48-bit space and return 8-bit color
  return color16To8(colorFrom48Index(random48Index()))
}

// selectPalette(size) — returns an array of `size` random 8-bit RGB triplets
export const selectPalette = (size) => {
  const palette = []
  for (let i = 0; i < size; i++) {
    palette.push(getRandomColor())
  }
  return palette
}

// selectPalette48(size, return16bit = false)
// If return16bit = true -> returns 16-bit `[r,g,b]` (0..65535). Otherwise returns 8-bit.
export const selectPalette48 = (size, return16bit = false) => {
  const palette = []
  for (let i = 0; i < size; i++) {
    const c16 = colorFrom48Index(random48Index())
    palette.push(return16bit ? c16 : color16To8(c16))
  }
  return palette
      }
    
