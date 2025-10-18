const horizontalGrille = (canvas, options = {}) => {
  const {
    shape = 'rectangle', // 'rectangle', 'circle', 'rounded', 'wave', 'zigzag'
    oddEven = true, // if true, alternates between odd and even lines
    oddShape = 'rectangle', // shape for odd lines when oddEven is true
    evenShape = 'rectangle', // shape for even lines when oddEven is true
  } = options

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `rgba(0, 0, 0, 0.25)`
  
  let lineIndex = 0
  for (let y = Math.round(canvas.height / 64); y < canvas.height; y += Math.round(canvas.height / 16)) {
    const currentShape = oddEven 
      ? (lineIndex % 2 === 0 ? evenShape : oddShape)
      : shape
    
    const height = Math.round(canvas.height / 32)
    
    switch(currentShape) {
      case 'circle':
        const radius = height / 2
        for (let x = radius; x < canvas.width; x += radius * 2) {
          ctx.beginPath()
          ctx.arc(x, y + radius, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        break
        
      case 'rounded':
        ctx.beginPath()
        const cornerRadius = height / 2
        ctx.roundRect(0, y, canvas.width, height, cornerRadius)
        ctx.fill()
        break
        
      case 'wave':
        ctx.beginPath()
        ctx.moveTo(0, y)
        const waveHeight = height / 2
        const waveLength = canvas.width / 8
        for (let x = 0; x <= canvas.width; x += waveLength / 2) {
          const wave = Math.sin((x / waveLength) * Math.PI * 2) * waveHeight
          ctx.lineTo(x, y + height / 2 + wave)
        }
        ctx.lineTo(canvas.width, y + height)
        ctx.lineTo(0, y + height)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'zigzag':
        ctx.beginPath()
        ctx.moveTo(0, y)
        const zigWidth = canvas.width / 16
        for (let x = 0; x <= canvas.width; x += zigWidth) {
          const isUp = (x / zigWidth) % 2 === 0
          ctx.lineTo(x, y + (isUp ? 0 : height))
        }
        ctx.lineTo(canvas.width, y + height)
        ctx.lineTo(0, y + height)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'rectangle':
      default:
        ctx.fillRect(0, y, canvas.width, height)
        break
    }
    
    lineIndex++
  }
}

export default horizontalGrille
