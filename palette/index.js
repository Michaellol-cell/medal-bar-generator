import prng from '../prng/index.js'

const MAX_COLOR_INDEX = 256 ** 3 // 16,777,216

// return a single random RGB triplet [r,g,b] with values 0..255
export const randomRGB = () => {
  const r = Math.floor(prng() * 256)
  const g = Math.floor(prng() * 256)
  const b = Math.floor(prng() * 256)
  return [r, g, b]
}

// safe hex helper: rgb -> "#rrggbb"
export const rgbToHex = ([r, g, b]) =>
  '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)

// index 0..16777215 -> [r,g,b]
export const colorFromIndex = (index) => {
  index = Math.max(0, Math.min(index | 0, MAX_COLOR_INDEX - 1))
  const r = (index >> 16) & 255
  const g = (index >> 8) & 255
  const b = index & 255
  return [r, g, b]
}

// [r,g,b] -> integer index 0..16777215
export const indexFromColor = ([r, g, b]) =>
  ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)

// selectPalette(size) — returns an array of `size` unique-ish random colors
// Note: generating millions of colors will be slow and memory-heavy.
export const selectPalette = (size) => {
  const palette = []
  for (let i = 0; i < size; i++) {
    palette.push(randomRGB())
  }
  return palette
}

// getRandomColor(palette) — if palette supplied, pick from it, otherwise return a random RGB
export const getRandomColor = (palette) => {
  if (!palette || palette.length === 0) return randomRGB()
  return palette[Math.floor(prng() * palette.length)]
}

// uniformly sample a color directly from full 24-bit space (no array)
export const getRandomColorFromSpace = () =>
  color
FromIndex(Math.floor(prng() * MAX_COLOR_INDEX))
