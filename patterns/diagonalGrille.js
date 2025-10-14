const diagonalGrille = (canvas) => {
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`
  ctx.lineWidth = canvas.height / 32
  const step = canvas.height / 16

  for (let i = -canvas.height; i < canvas.width; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + canvas.height, canvas.height)
    ctx.stroke()
  }
}

export default diagonalGrille
