// Dibujo "a boli": todas las formas tiemblan un poco y el relleno de
// subrayador se sale de la raya, como en un cuaderno de clase.

export const INK = '#1f3a93'; // boli azul (tú y los amigos)
export const RED = '#c62828'; // boli rojo (los malos)
export const BLACK = '#26262e'; // rotulador (los jefes)
export const PENCIL = '#55555f';

export const HL = {
  yellow: 'rgba(255,222,0,.55)',
  pink: 'rgba(255,92,170,.42)',
  green: 'rgba(110,220,80,.5)',
  orange: 'rgba(255,150,30,.5)',
  blue: 'rgba(70,170,255,.4)',
  purple: 'rgba(170,110,255,.4)',
  brown: 'rgba(170,105,45,.55)',
  red: 'rgba(230,50,40,.5)',
  gray: 'rgba(120,120,135,.38)',
  dark: 'rgba(30,30,50,.72)',
  white: 'rgba(255,255,255,.92)',
  skin: 'rgba(255,200,170,.75)',
};

const HAND = '"Patrick Hand", "Comic Neue", cursive';
const COMIC = '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", cursive';
export let FONT = HAND;
export function setComic(on) {
  FONT = on ? COMIC : HAND;
}

// Hash determinista: misma semilla = mismo temblor (así la línea "hierve"
// a pocos fotogramas por segundo en vez de vibrar a lo loco).
const h = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export class Pen {
  constructor(ctx) {
    this.ctx = ctx;
    this.s = 0;
    this.k = 0;
    this.amp = 1.3;
    this.color = INK;
  }

  begin(seed, color = INK, width = 2.4) {
    this.s = seed;
    this.k = 0;
    const c = this.ctx;
    c.strokeStyle = this.color = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    return this;
  }

  width(w) {
    this.ctx.lineWidth = w;
    return this;
  }

  j(a = this.amp) {
    return (h(this.s * 0.013 + ++this.k * 1.7) - 0.5) * 2 * a;
  }

  _path(pts, smooth, closed) {
    const c = this.ctx;
    const n = pts.length / 2;
    c.beginPath();
    if (!smooth) {
      c.moveTo(pts[0], pts[1]);
      for (let i = 1; i < n; i++) c.lineTo(pts[i * 2], pts[i * 2 + 1]);
      if (closed) c.closePath();
      return;
    }
    if (closed) {
      const lx = pts[(n - 1) * 2];
      const ly = pts[(n - 1) * 2 + 1];
      c.moveTo((lx + pts[0]) / 2, (ly + pts[1]) / 2);
      for (let i = 0; i < n; i++) {
        const x = pts[i * 2];
        const y = pts[i * 2 + 1];
        const nx = pts[((i + 1) % n) * 2];
        const ny = pts[((i + 1) % n) * 2 + 1];
        c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
      }
      c.closePath();
    } else {
      c.moveTo(pts[0], pts[1]);
      for (let i = 1; i < n - 1; i++) {
        const x = pts[i * 2];
        const y = pts[i * 2 + 1];
        c.quadraticCurveTo(x, y, (x + pts[i * 2 + 2]) / 2, (y + pts[i * 2 + 3]) / 2);
      }
      c.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
    }
  }

  _shape(pts, fill, smooth) {
    const c = this.ctx;
    if (fill) {
      // el subrayador nunca coincide con el contorno
      c.save();
      c.translate(this.j(1.8), this.j(1.8));
      this._path(pts, smooth, true);
      c.fillStyle = fill;
      c.fill();
      c.restore();
    }
    this._path(pts, smooth, true);
    c.stroke();
  }

  ellipse(x, y, rx, ry, fill, rot = 0) {
    const n = Math.max(7, Math.min(16, Math.round((rx + ry) / 2.5)));
    const pts = [];
    const a0 = this.j(0.4);
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    const amp = Math.min(this.amp, (rx + ry) * 0.08);
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      const px = Math.cos(a) * (rx + this.j(amp));
      const py = Math.sin(a) * (ry + this.j(amp));
      pts.push(x + px * cr - py * sr, y + px * sr + py * cr);
    }
    this._shape(pts, fill, true);
    return this;
  }

  circle(x, y, r, fill) {
    return this.ellipse(x, y, r, r, fill);
  }

  poly(pts, fill, closed = true) {
    const p = pts.map((v) => v + this.j(this.amp * 0.8));
    if (closed) this._shape(p, fill, false);
    else {
      this._path(p, false, false);
      this.ctx.stroke();
    }
    return this;
  }

  line(x1, y1, x2, y2) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x1 + this.j(0.6), y1 + this.j(0.6));
    c.quadraticCurveTo((x1 + x2) / 2 + this.j(), (y1 + y2) / 2 + this.j(), x2 + this.j(0.6), y2 + this.j(0.6));
    c.stroke();
    return this;
  }

  curve(pts) {
    const p = pts.map((v) => v + this.j(this.amp * 0.7));
    this._path(p, true, false);
    this.ctx.stroke();
    return this;
  }

  dot(x, y, r = 2.2, color) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x + this.j(0.4), y + this.j(0.4), Math.max(0.5, r), 0, Math.PI * 2);
    c.fillStyle = color || this.color;
    c.fill();
    return this;
  }

  text(str, x, y, size = 20, color, align = 'center') {
    const c = this.ctx;
    c.font = `${Math.round(size)}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = color || this.color;
    c.fillText(str, x, y);
    return this;
  }
}
