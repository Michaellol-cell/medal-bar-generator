// enhancedHorizontalGrille.js
// Preserves original behavior by default but adds many shape/options.
// Usage: horizontalGrille(canvas)  OR  horizontalGrille(canvas, options)

const horizontalGrille = (canvas, opts = {}) => {
  const ctx = canvas.getContext('2d');

  // defaults that preserve original look
  const defaults = {
    shapes: ['horizontal'],       // 'horizontal' | 'vertical' | 'grid' | 'diagonal' | 'dots' | 'wavy' | 'rectangles' | 'lines'
    color: 'rgba(0, 0, 0, 0.25)',
    spacing: Math.round(canvas.height / 16),
    thickness: Math.max(1, Math.round(canvas.height / 32)),
    startOffset: Math.round(canvas.height / 64),
    oddEven: 'both',              // 'both' | 'odd' | 'even'
    jitter: 0,                    // max pixel jitter applied to each line/band
    amplitude: Math.max(2, Math.round(canvas.height / 64)), // for wavy shape
    dotRadius: Math.max(1, Math.round(canvas.height / 128)),
    rectPadding: 2,               // padding between rectangles in 'rectangles' mode
    density: 1,                   // multiplier for how many elements per spacing (1 = default)
    seed: null                    // optional numeric seed for deterministic randomness
  };

  const o = Object.assign({}, defaults, opts);

  // simple seeded RNG if seed provided, otherwise Math.random
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

  // normalize shapes input
  const shapes = Array.isArray(o.shapes) ? o.shapes : [o.shapes];

  // quick helpers
  const randBetween = (a, b) => a + (b - a) * rng();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ensure canvas integer dims (don't change size, just use)
  const W = canvas.width;
  const H = canvas.height;

  // draw each requested shape mode
  shapes.forEach((shapeMode) => {
    switch ((shapeMode || '').toLowerCase()) {
      case 'horizontal': {
        let i = 0;
        for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(i++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          const shiftX = (i % 2 === 0) ? Math.round(o.thickness * 0.1) : -Math.round(o.thickness * 0.1);
          ctx.fillStyle = o.color;
          ctx.fillRect(shiftX, y + jitter, W, o.thickness);
        }
        break;
      }

      case 'vertical': {
        let i = 0;
        for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(i++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(x + jitter, 0, o.thickness, H);
        }
        break;
      }

      case 'grid': {
        // draws horizontal + vertical
        horizontalPass: {
          let i = 0;
          for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
            if (!useIndex(i++)) continue;
            const jitter = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.fillStyle = o.color;
            ctx.fillRect(0, y + jitter, W, o.thickness);
          }
        }
        verticalPass: {
          let i = 0;
          for (let x = o.startOffset; x < W; x += Math.max(1, Math.round(o.spacing / o.density))) {
            if (!useIndex(i++)) continue;
            const jitter = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.fillStyle = o.color;
            ctx.fillRect(x + jitter, 0, o.thickness, H);
          }
        }
        break;
      }

      case 'diagonal': {
        // draws 45-degree diagonal strokes using stroke (works nicely for thin to medium thickness)
        ctx.strokeStyle = o.color;
        ctx.lineWidth = Math.max(1, o.thickness);
        let idx = 0;
        for (let start = -H; start < W; start += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(idx++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          const x0 = start + jitter;
          ctx.beginPath();
          ctx.moveTo(x0, 0);
          ctx.lineTo(x0 + H, H);
          ctx.stroke();
        }
        break;
      }

      case 'dots': {
        // draws a grid of dots; rows/cols spaced by spacing, radius defined by dotRadius
        ctx.fillStyle = o.color;
        let row = 0;
        const step = Math.max(2, Math.round(o.spacing / o.density));
        for (let y = o.startOffset; y < H; y += step) {
          if (!useIndex(row++)) continue;
          for (let x = o.startOffset; x < W; x += step) {
            const jitterX = Math.round(randBetween(-o.jitter, o.jitter));
            const jitterY = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.beginPath();
            ctx.arc(x + jitterX, y + jitterY, clamp(o.dotRadius * (0.6 + rng() * 0.8), 0.5, 100), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case 'wavy': {
        // wavy filled bands along horizontal rows (sinusoidal)
        const waveLength = Math.max(20, Math.round(W / 2));
        const step = Math.max(1, Math.round(o.spacing / o.density));
        let ridx = 0;
        for (let yBase = o.startOffset; yBase < H; yBase += step) {
          if (!useIndex(ridx++)) continue;
          const phase = rng() * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, yBase);
          for (let x = 0; x <= W; x += 2) {
            const wy = yBase + Math.sin((x / waveLength) * Math.PI * 2 + phase) * o.amplitude;
            ctx.lineTo(x, wy);
          }
          // close the band and fill (create thickness by adding a lower copy)
          for (let x = W; x >= 0; x -= 2) {
            const wy = yBase + o.thickness + Math.sin((x / waveLength) * Math.PI * 2 + phase) * o.amplitude;
            ctx.lineTo(x, wy);
          }
          ctx.closePath();
          ctx.fillStyle = o.color;
          ctx.fill();
        }
        break;
      }

      case 'rectangles': {
        // staggered rectangles across rows
        const step = Math.max(1, Math.round(o.spacing / o.density));
        let rindex = 0;
        for (let y = o.startOffset; y < H; y += step) {
          if (!useIndex(rindex++)) continue;
          let x = (rindex % 2 === 0) ? 0 : Math.round(o.spacing / 2);
          while (x < W) {
            const w = Math.max(2, Math.round(o.spacing * (0.5 + rng() * 1.5)));
            const h = o.thickness;
            const jitterX = Math.round(randBetween(-o.jitter, o.jitter));
            const jitterY = Math.round(randBetween(-o.jitter, o.jitter));
            ctx.fillStyle = o.color;
            ctx.fillRect(x + jitterX, y + jitterY, w - o.rectPadding, h);
            x += w + o.rectPadding;
          }
        }
        break;
      }

      case 'lines': {
        // thin stroked lines (versatile line mode)
        ctx.strokeStyle = o.color;
        ctx.lineWidth = Math.max(1, Math.round(o.thickness / 2));
        let li = 0;
        for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(li++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.beginPath();
          ctx.moveTo(0, y + jitter);
          ctx.lineTo(W, y + jitter);
          ctx.stroke();
        }
        break;
      }

      default: {
        // unknown shape -> fallback to original horizontal
        let k = 0;
        for (let y = o.startOffset; y < H; y += Math.max(1, Math.round(o.spacing / o.density))) {
          if (!useIndex(k++)) continue;
          const jitter = Math.round(randBetween(-o.jitter, o.jitter));
          ctx.fillStyle = o.color;
          ctx.fillRect(0, y + jitter, W, o.thickness);
        }
        break;
      }
    } // end switch
  }); // end shapes.forEach
};

export default horizontalGrille;
        
