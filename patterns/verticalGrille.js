// enhancedVerticalGrille.js
// Preserves original behaviour by default but adds many shape/options.
// Usage: verticalGrille(canvas) OR verticalGrille(canvas, options)

const verticalGrille = (canvas, opts = {}) => {
  const ctx = canvas.getContext('2d');

  // defaults that preserve original look
  const defaults = {
    shapes: ['vertical'],         // 'vertical' | 'horizontal' | 'grid' | 'diagonal' | 'dots' | 'wavy' | 'rectangles' | 'lines'
    color: 'rgba(0, 0, 0, 0.25)',
    spacing: Math.round(canvas.width / 16),
    thickness: Math.max(1, Math.round(canvas.width / 32)),
    startOffset: Math.round(canvas.width / 64),
    oddEven: 'both',              // 'both' | 'odd' | 'even'
    jitter: 0,                    // max pixel jitter applied to each column/band
    amplitude: Math.max(2, Math.round(canvas.width / 64)), // for wavy shape (horizontal amplitude)
    dotRadius: Math.max(1, Math.round(canvas.width / 128)),
    rectPadding: 2,
    density: 1,
    seed: null
  };

  const o = Object.assign({}, defaults, opts);

  // seeded RNG if seed provided; otherwise Math.random
  let rng = Math.random;
  if (typeof o.seed === 'number') {
    let s = o.seed | 0;
    rng = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) / 4294967295);
    };
  }

  // odd/even filter helper: index i starts at 0
  const useIndex = (i) => {
    if (o.oddEven === 'both') return true;
    if (o.oddEven === 'odd') return (i % 2) === 1;
    return (i % 2) === 0; // 'even'
  };

  const shapes = Array.isArray(o.shapes) ? o.shapes : [o.shapes];
  const randBetween = (a, b) => a + (b - a) * rng();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const W = canvas.width;
  const H = canvas.height;

  shapes.forEach((shapeMode) => {
    switch ((shapeMode || '').toLowerCase()) {
      case 'vertical': {
        let i = 0;
        for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(i++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          const shiftY = (i % 2 === 0) ? Math.round(o.thickness * 0.1) : -Math.round(o.thickness * 0.1);
          ctx.fillStyle = o.color;
          ctx.fillRect(x + jitter, shiftY, o.thickness, H);
        }
        break;
      }

      case 'horizontal': {
        let i = 0;
        for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(i++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(0, y + jitter, W, o.thickness);
        }
        break;
      }

      case 'grid': {
        // vertical pass
        let iv = 0;
        for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(iv++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(x + jitter, 0, o.thickness, H);
        }
        // horizontal pass
        let ih = 0;
        for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(ih++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(0, y + jitter, W, o.thickness);
        }
        break;
      }

      case 'diagonal': {
        // draws 45-degree diagonal strokes (thin) across canvas
        ctx.strokeStyle = o.color;
        ctx.lineWidth = Math.max(1, o.thickness);
        let idx = 0;
        for (let start = -W; start < H; start += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(idx++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          const y0 = start + jitter;
          ctx.beginPath();
          ctx.moveTo(0, y0);
          ctx.lineTo(W, y0 + W); // 45-degree-ish
          ctx.stroke();
        }
        break;
      }

      case 'dots': {
        ctx.fillStyle = o.color;
        let col = 0;
        const step = Math.max(2, Math.round(o.spacing / o.density));
        for (let x = o.startOffset; x < W; x += step) {
          if (!useIndex(col++)) continue;
          for (let y = o.startOffset; y < H; y += step) {
            const jx = Math.round(randBetween(-o.jitter, o.jitter));
            const jy = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.beginPath();
            ctx.arc(x + jx, y + jy, clamp(o.dotRadius * (0.6 + rng() * 0.8), 0.5, 100), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case 'wavy': {
        // vertical wavy bands (sinusoidal along height)
        const waveLength = Math.max(20, Math.round(H / 2));
        const step = Math.max(1, Math.round(o.spacing / o.density));
        let ridx = 0;
        for (let xBase = o.startOffset; xBase < W; xBase += step) {
          if (!useIndex(ridx++)) continue;
          const phase = rng() * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(xBase, 0);
          for (let y = 0; y <= H; y += 2) {
            const wx = xBase + Math.sin((y / waveLength) * Math.PI * 2 + phase) * o.amplitude;
            ctx.lineTo(wx, y);
          }
          // close the band with a right-side copy to create thickness
          for (let y = H; y >= 0; y -= 2) {
            const wx = xBase + o.thickness + Math.sin((y / waveLength) * Math.PI * 2 + phase) * o.amplitude;
            ctx.lineTo(wx, y);
          }
          ctx.closePath();
          ctx.fillStyle = o.color;
          ctx.fill();
        }
        break;
      }

      case 'rectangles': {
        const step = Math.max(1, Math.round(o.spacing / o.density));
        let rindex = 0;
        for (let x = o.startOffset; x < W; x += step) {
          if (!useIndex(rindex++)) continue;
          let y = (rindex % 2 === 0) ? 0 : Math.round(o.spacing / 2);
          while (y < H) {
            const h = Math.max(2, Math.round(o.spacing * (0.5 + rng() * 1.5)));
            const w = o.thickness;
            const jitterX = Math.round(randBetween(-o.jitter, o.jitter));
            const jitterY = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.fillStyle = o.color;
            ctx.fillRect(x + jitterX, y + jitterY, w, h - o.rectPadding);
            y += h + o.rectPadding;
          }
        }
        break;
      }

      case 'lines': {
        // thin stroked vertical lines
        ctx.strokeStyle = o.color;
        ctx.lineWidth = Math.max(1, Math.round(o.thickness / 2));
        let li = 0;
        for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(li++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.beginPath();
          ctx.moveTo(x + jitter, 0);
          ctx.lineTo(x + jitter, H);
          ctx.stroke();
        }
        break;
      }

      default: {
        // fallback -> original vertical
        let k = 0;
        for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(k++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(x + jitter, 0, o.thickness, H);
        }
        break;
      }
    } // end switch
  }); // end shapes.forEach
};

export default verticalGrille;
              
