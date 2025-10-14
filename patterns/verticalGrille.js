const verticalGrille = (canvas) => {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `rgba(0, 0, 0, 0.25)`
  for (let x = Math.round(canvas.width / 64); x < canvas.width; x += Math.round(canvas.width / 16)) {
    ctx.fillRect(x, 0, Math.round(canvas.width / 32), canvas.height)
  }
}

export default verticalGrille
