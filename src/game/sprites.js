// Todos los dibujos del juego. Cada función dibuja centrada en (0,0)
// con radio aproximado r. Los jugadores miran hacia arriba y los
// enemigos hacia abajo.
import { HL, INK, RED, BLACK, FONT } from './doodle.js';

const S = Math.sin;

export const SPRITES = {
  // ───────────── PERSONAJES ─────────────
  michi(p, r, t) {
    p.curve([r * 0.3, r * 0.85, r * 0.75, r * 1.0, r * 0.88, r * 0.62, r * 0.72, r * 0.35 + S(t * 6) * r * 0.12]);
    p.ellipse(0, r * 0.68, r * 0.45, r * 0.38, HL.orange);
    p.poly([-r * 0.72, -r * 0.25, -r * 0.62, -r * 1.05, -r * 0.15, -r * 0.62], HL.orange);
    p.poly([r * 0.72, -r * 0.25, r * 0.62, -r * 1.05, r * 0.15, -r * 0.62], HL.orange);
    p.circle(0, -r * 0.12, r * 0.72, HL.orange);
    p.ellipse(-r * 0.28, -r * 0.26, r * 0.16, r * 0.2, HL.white);
    p.ellipse(r * 0.28, -r * 0.26, r * 0.16, r * 0.2, HL.white);
    p.dot(-r * 0.28, -r * 0.3, r * 0.08, '#ff2d55');
    p.dot(r * 0.28, -r * 0.3, r * 0.08, '#ff2d55');
    p.poly([-r * 0.08, -r * 0.03, r * 0.08, -r * 0.03, 0, r * 0.07], HL.pink);
    p.curve([-r * 0.2, r * 0.13, -r * 0.1, r * 0.21, 0, r * 0.1]);
    p.curve([0, r * 0.1, r * 0.1, r * 0.21, r * 0.2, r * 0.13]);
    p.line(-r * 0.35, r * 0.02, -r * 0.88, -r * 0.08);
    p.line(-r * 0.35, r * 0.1, -r * 0.88, r * 0.16);
    p.line(r * 0.35, r * 0.02, r * 0.88, -r * 0.08);
    p.line(r * 0.35, r * 0.1, r * 0.88, r * 0.16);
  },

  tostadora(p, r, t) {
    const pop = Math.max(0, S(t * 5)) * r * 0.12;
    p.ellipse(-r * 0.36, -r * 0.55 - pop, r * 0.26, r * 0.32, HL.brown);
    p.ellipse(r * 0.36, -r * 0.6 - pop, r * 0.26, r * 0.32, HL.brown);
    p.poly([-r * 0.85, -r * 0.42, r * 0.85, -r * 0.42, r * 0.92, r * 0.72, -r * 0.92, r * 0.72], HL.blue);
    p.ellipse(-r * 0.36, -r * 0.42, r * 0.3, r * 0.06);
    p.ellipse(r * 0.36, -r * 0.42, r * 0.3, r * 0.06);
    p.dot(-r * 0.3, r * 0.02, r * 0.08);
    p.dot(r * 0.3, r * 0.02, r * 0.08);
    p.curve([-r * 0.3, r * 0.25, 0, r * 0.45, r * 0.3, r * 0.25]);
    p.circle(-r * 0.55, r * 0.25, r * 0.1, HL.pink);
    p.circle(r * 0.55, r * 0.25, r * 0.1, HL.pink);
    p.line(r * 0.92, 0, r * 1.18, -r * 0.12);
    p.circle(r * 1.2, -r * 0.14, r * 0.09, HL.red);
  },

  vaca(p, r, t) {
    for (const x of [-0.5, -0.18, 0.18, 0.5]) p.line(x * r, r * 0.65, x * r * 1.1, r * 0.98 + S(t * 9 + x * 5) * r * 0.05);
    p.ellipse(0, r * 0.8, r * 0.18, r * 0.12, HL.pink);
    p.ellipse(0, r * 0.3, r * 0.88, r * 0.6, HL.white);
    p.ellipse(-r * 0.42, r * 0.2, r * 0.22, r * 0.16, HL.dark);
    p.ellipse(r * 0.38, r * 0.45, r * 0.2, r * 0.14, HL.dark);
    p.ellipse(r * 0.15, r * 0.02, r * 0.12, r * 0.09, HL.dark);
    p.curve([-r * 0.28, -r * 0.88, -r * 0.45, -r * 1.06, -r * 0.33, -r * 1.18]);
    p.curve([r * 0.28, -r * 0.88, r * 0.45, -r * 1.06, r * 0.33, -r * 1.18]);
    p.ellipse(-r * 0.56, -r * 0.7, r * 0.18, r * 0.08, HL.white, -0.4);
    p.ellipse(r * 0.56, -r * 0.7, r * 0.18, r * 0.08, HL.white, 0.4);
    p.circle(0, -r * 0.6, r * 0.42, HL.white);
    p.ellipse(0, -r * 0.38, r * 0.28, r * 0.17, HL.pink);
    p.dot(-r * 0.1, -r * 0.38, r * 0.045);
    p.dot(r * 0.1, -r * 0.38, r * 0.045);
    p.dot(-r * 0.17, -r * 0.7, r * 0.06);
    p.dot(r * 0.17, -r * 0.7, r * 0.06);
  },

  pinguino(p, r) {
    p.ellipse(-r * 0.25, r * 0.9, r * 0.18, r * 0.08, HL.orange);
    p.ellipse(r * 0.25, r * 0.9, r * 0.18, r * 0.08, HL.orange);
    p.ellipse(-r * 0.62, r * 0.15, r * 0.16, r * 0.42, HL.dark, 0.4);
    p.ellipse(r * 0.62, r * 0.15, r * 0.16, r * 0.42, HL.dark, -0.4);
    p.ellipse(0, r * 0.05, r * 0.62, r * 0.88, HL.dark);
    p.ellipse(0, r * 0.25, r * 0.42, r * 0.6, HL.white);
    p.circle(-r * 0.2, -r * 0.45, r * 0.15, HL.white);
    p.circle(r * 0.2, -r * 0.45, r * 0.15, HL.white);
    p.line(-r * 0.05, -r * 0.45, r * 0.05, -r * 0.45);
    p.dot(-r * 0.2, -r * 0.45, r * 0.05);
    p.dot(r * 0.2, -r * 0.45, r * 0.05);
    p.poly([-r * 0.12, -r * 0.26, r * 0.12, -r * 0.26, 0, -r * 0.08], HL.orange);
    p.poly([-r * 0.08, -r * 0.02, r * 0.08, -r * 0.02, r * 0.05, r * 0.35, 0, r * 0.45, -r * 0.05, r * 0.35], HL.red);
  },

  baguette(p, r) {
    p.ellipse(0, 0, r * 0.4, r * 1.3, 'rgba(225,165,70,.65)');
    for (const y of [-0.7, -0.3, 0.1, 0.5]) p.line(-r * 0.2, y * r - r * 0.1, r * 0.2, y * r + r * 0.08);
    p.poly([-r * 0.32, -r * 0.62, r * 0.32, -r * 0.62, r * 0.28, -r * 0.5, -r * 0.28, -r * 0.5], HL.dark);
    p.curve([-r * 0.15, -r * 0.3, 0, -r * 0.2, r * 0.15, -r * 0.3]);
  },

  // ───────────── ENEMIGOS ─────────────
  pato(p, r, t) {
    const f = S(t * 22) * 0.35;
    p.ellipse(-r * 0.65, -r * 0.08, r * 0.36, r * 0.2, HL.yellow, 0.5 + f);
    p.ellipse(r * 0.65, -r * 0.08, r * 0.36, r * 0.2, HL.yellow, -0.5 - f);
    p.ellipse(0, -r * 0.2, r * 0.6, r * 0.55, HL.yellow);
    p.circle(0, r * 0.35, r * 0.42, HL.yellow);
    p.poly([-r * 0.22, r * 0.6, r * 0.22, r * 0.6, 0, r * 1.02], HL.orange);
    p.dot(-r * 0.17, r * 0.32, r * 0.07);
    p.dot(r * 0.17, r * 0.32, r * 0.07);
    p.line(-r * 0.3, r * 0.14, -r * 0.07, r * 0.23);
    p.line(r * 0.3, r * 0.14, r * 0.07, r * 0.23);
  },

  pulpo(p, r, t) {
    for (let i = 0; i < 5; i++) {
      const x0 = (i - 2) * r * 0.28;
      p.curve([
        x0, r * 0.2,
        x0 + S(t * 5 + i) * r * 0.2, r * 0.6,
        x0 + S(t * 5 + i + 1) * r * 0.25, r * 1.0,
        x0 + S(t * 5 + i + 2) * r * 0.2, r * 1.3,
      ]);
    }
    p.ellipse(0, -r * 0.15, r * 0.7, r * 0.62, HL.pink);
    p.circle(-r * 0.25, -r * 0.1, r * 0.17, HL.white);
    p.circle(r * 0.25, -r * 0.1, r * 0.17, HL.white);
    p.line(-r * 0.08, -r * 0.1, r * 0.08, -r * 0.1);
    p.dot(-r * 0.25, -r * 0.07, r * 0.06);
    p.dot(r * 0.25, -r * 0.07, r * 0.06);
    p.circle(0, r * 0.22, r * 0.07);
  },

  brocoli(p, r) {
    p.poly([-r * 0.25, 0, r * 0.25, 0, r * 0.2, r * 0.85, -r * 0.2, r * 0.85], HL.green);
    p.circle(-r * 0.45, -r * 0.15, r * 0.35, HL.green);
    p.circle(r * 0.45, -r * 0.15, r * 0.35, HL.green);
    p.circle(0, -r * 0.45, r * 0.4, HL.green);
    p.circle(0, -r * 0.05, r * 0.35, HL.green);
    p.line(-r * 0.2, r * 0.2, -r * 0.03, r * 0.3);
    p.line(r * 0.2, r * 0.2, r * 0.03, r * 0.3);
    p.dot(-r * 0.1, r * 0.4, r * 0.05);
    p.dot(r * 0.1, r * 0.4, r * 0.05);
    p.poly([-r * 0.12, r * 0.62, -r * 0.04, r * 0.55, r * 0.04, r * 0.62, r * 0.12, r * 0.55], null, false);
  },

  pizza(p, r) {
    p.circle(0, 0, r, HL.yellow);
    p.circle(0, 0, r * 0.8);
    p.line(-r * 0.8, 0, r * 0.8, 0);
    p.line(-r * 0.56, -r * 0.56, r * 0.56, r * 0.56);
    p.line(r * 0.56, -r * 0.56, -r * 0.56, r * 0.56);
    for (const [x, y] of [[0.45, 0.2], [-0.4, 0.35], [-0.2, -0.5], [0.32, -0.42], [0.05, 0.6]]) {
      p.circle(x * r, y * r, r * 0.12, HL.red);
    }
    p.circle(-r * 0.2, -r * 0.1, r * 0.11, HL.white);
    p.circle(r * 0.2, -r * 0.1, r * 0.11, HL.white);
    p.dot(-r * 0.2, -r * 0.06, r * 0.05);
    p.dot(r * 0.2, -r * 0.06, r * 0.05);
  },

  slice(p, r) {
    p.poly([-r * 0.85, -r * 0.6, r * 0.85, -r * 0.6, 0, r * 1.0], HL.yellow);
    p.curve([-r * 0.9, -r * 0.55, 0, -r * 0.85, r * 0.9, -r * 0.55]);
    p.circle(-r * 0.25, -r * 0.2, r * 0.13, HL.red);
    p.circle(r * 0.1, r * 0.3, r * 0.12, HL.red);
    p.dot(-r * 0.15, r * 0.02, r * 0.06);
    p.dot(r * 0.18, -r * 0.1, r * 0.06);
  },

  cabra(p, r) {
    p.curve([-r * 0.25, -r * 0.6, -r * 0.5, -r * 1.0, -r * 0.78, -r * 0.9]);
    p.curve([r * 0.25, -r * 0.6, r * 0.5, -r * 1.0, r * 0.78, -r * 0.9]);
    p.ellipse(-r * 0.65, -r * 0.35, r * 0.28, r * 0.11, HL.white, 0.3);
    p.ellipse(r * 0.65, -r * 0.35, r * 0.28, r * 0.11, HL.white, -0.3);
    p.ellipse(0, 0, r * 0.55, r * 0.72, 'rgba(235,235,235,.9)');
    p.circle(-r * 0.25, -r * 0.2, r * 0.15, HL.yellow);
    p.circle(r * 0.25, -r * 0.2, r * 0.15, HL.yellow);
    p.width(3.2);
    p.line(-r * 0.33, -r * 0.2, -r * 0.17, -r * 0.2);
    p.line(r * 0.17, -r * 0.2, r * 0.33, -r * 0.2);
    p.width(2.4);
    p.dot(-r * 0.1, r * 0.45, r * 0.05);
    p.dot(r * 0.1, r * 0.45, r * 0.05);
    p.poly([-r * 0.15, r * 0.62, r * 0.15, r * 0.62, 0, r * 1.08], HL.gray);
  },

  platano(p, r) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = -1 + (i / 8) * 2;
      pts.push(Math.sin(a) * r * 1.1, r * 0.7 - Math.cos(a) * r * 1.1);
    }
    for (let i = 8; i >= 0; i--) {
      const a = -1 + (i / 8) * 2;
      pts.push(Math.sin(a) * r * 0.8, r * 0.75 - Math.cos(a) * r * 0.8);
    }
    p.poly(pts, HL.yellow);
    p.dot(-r * 0.2, -r * 0.22, r * 0.06);
    p.dot(r * 0.2, -r * 0.22, r * 0.06);
    p.line(-r * 0.12, -r * 0.08, r * 0.12, -r * 0.1);
  },

  huevo(p, r, t) {
    const look = S(t * 2) * r * 0.06;
    p.ellipse(0, 0, r * 0.72, r * 0.92, HL.white);
    p.poly([-r * 0.62, -r * 0.05, -r * 0.3, -r * 0.22, -r * 0.1, 0, r * 0.15, -r * 0.22, r * 0.35, -r * 0.02, r * 0.64, -r * 0.16], null, false);
    p.dot(-r * 0.2 + look, r * 0.22, r * 0.06);
    p.dot(r * 0.2 + look, r * 0.22, r * 0.06);
  },

  pollito(p, r, t, e) {
    const d = e?.data?.dir ?? 1;
    p.line(-r * 0.2, r * 0.45, -r * 0.25 + S(t * 25) * r * 0.18, r * 0.88);
    p.line(r * 0.2, r * 0.45, r * 0.25 - S(t * 25) * r * 0.18, r * 0.88);
    p.circle(0, 0, r * 0.62, HL.yellow);
    p.poly([r * 0.45 * d, -r * 0.08, r * 0.88 * d, 0, r * 0.45 * d, r * 0.12], HL.orange);
    p.dot(r * 0.25 * d, -r * 0.15, r * 0.08);
    p.curve([0, -r * 0.6, r * 0.12, -r * 0.88, -r * 0.05, -r * 0.98]);
  },

  // ───────────── JEFES ─────────────
  lunes(p, r, t) {
    p.circle(r * 0.55, r * 0.7, r * 0.3, 'rgba(140,90,40,.22)');
    p.poly([-r, -r * 0.75, r, -r * 0.75, r * 0.95, r, -r * 0.95, r], HL.white);
    p.poly([-r, -r * 0.75, r, -r * 0.75, r, -r * 0.4, -r, -r * 0.4], HL.red);
    for (const x of [-0.6, -0.2, 0.2, 0.6]) p.ellipse(x * r, -r * 0.82, r * 0.06, r * 0.12);
    p.text('LUNES', 0, -r * 0.57, r * 0.3, BLACK);
    const blink = (t % 3.5) < 0.12 ? 0.02 : 1;
    p.ellipse(-r * 0.38, r * 0.0, r * 0.17, r * 0.17 * blink, HL.white);
    p.ellipse(r * 0.38, r * 0.0, r * 0.17, r * 0.17 * blink, HL.white);
    p.dot(-r * 0.35, r * 0.04, r * 0.07);
    p.dot(r * 0.35, r * 0.04, r * 0.07);
    p.width(3.5);
    p.line(-r * 0.62, -r * 0.24, -r * 0.18, -r * 0.12);
    p.line(r * 0.62, -r * 0.24, r * 0.18, -r * 0.12);
    p.width(2.6);
    p.curve([-r * 0.4, r * 0.6, -r * 0.2, r * 0.45, 0, r * 0.52, r * 0.2, r * 0.42, r * 0.4, r * 0.6]);
  },

  abuela(p, r) {
    p.circle(0, -r * 0.98, r * 0.3, HL.gray);
    for (let i = 0; i <= 8; i++) {
      const a = -2.75 + (i / 8) * 2.36;
      p.circle(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.2, HL.gray);
    }
    p.circle(0, 0, r * 0.8, HL.skin);
    p.circle(-r * 0.3, -r * 0.1, r * 0.22, 'rgba(255,255,255,.55)');
    p.circle(r * 0.3, -r * 0.1, r * 0.22, 'rgba(255,255,255,.55)');
    p.line(-r * 0.08, -r * 0.12, r * 0.08, -r * 0.12);
    p.dot(-r * 0.3, -r * 0.08, r * 0.06);
    p.dot(r * 0.3, -r * 0.08, r * 0.06);
    p.curve([-r * 0.52, -r * 0.05, -r * 0.7, r * 0.4, -r * 0.5, r * 0.78]);
    p.curve([r * 0.52, -r * 0.05, r * 0.7, r * 0.4, r * 0.5, r * 0.78]);
    p.circle(-r * 0.46, r * 0.25, r * 0.12, HL.pink);
    p.circle(r * 0.46, r * 0.25, r * 0.12, HL.pink);
    p.curve([-r * 0.3, r * 0.38, 0, r * 0.56, r * 0.3, r * 0.38]);
    p.dot(-r * 0.82, r * 0.15, r * 0.06, '#c9a227');
    p.dot(r * 0.82, r * 0.15, r * 0.06, '#c9a227');
  },

  router(p, r, t) {
    p.line(-r * 0.6, -r * 0.15, -r * 0.78, -r * 1.0);
    p.dot(-r * 0.78, -r * 1.02, r * 0.07);
    p.line(r * 0.6, -r * 0.15, r * 0.78, -r * 1.0);
    p.dot(r * 0.78, -r * 1.02, r * 0.07);
    const lit = Math.floor(t * 3) % 4;
    for (let k = 0; k < 3; k++) {
      if (k >= lit) continue;
      const R = r * (0.3 + k * 0.2);
      const pts = [];
      for (let i = 0; i <= 4; i++) {
        const a = -Math.PI / 2 - 0.7 + (i / 4) * 1.4;
        pts.push(Math.cos(a) * R, -r * 0.2 + Math.sin(a) * R);
      }
      p.curve(pts);
    }
    p.poly([-r, -r * 0.15, r, -r * 0.15, r * 0.92, r * 0.58, -r * 0.92, r * 0.58], HL.gray);
    p.width(3.4);
    p.line(-r * 0.55, r * 0.0, -r * 0.2, r * 0.08);
    p.line(r * 0.55, r * 0.0, r * 0.2, r * 0.08);
    p.width(2.6);
    const cols = ['#2e9e3f', '#d33', '#e8a100'];
    for (let i = 0; i < 6; i++) {
      p.dot(-r * 0.6 + i * r * 0.24, r * 0.25, r * 0.06, cols[(Math.floor(t * 6 + i * 1.7)) % 3]);
    }
    p.text('WiFi_Malvado_5G', 0, r * 0.43, r * 0.17, BLACK);
  },
};

// ───────────── PROYECTILES ─────────────
export function drawProjectile(p, b) {
  const r = b.r;
  switch (b.kind) {
    case 'laser':
      p.width(Math.max(2.5, r * 0.9));
      p.line(0, -r * 2.6, 0, r * 2.6);
      break;
    case 'toast':
    case 'burnt':
      p.ellipse(0, -r * 0.55, r, r * 0.45, b.kind === 'burnt' ? HL.dark : HL.brown);
      p.poly([-r, -r * 0.55, r, -r * 0.55, r, r, -r, r], b.kind === 'burnt' ? HL.dark : HL.brown);
      if (b.kind === 'burnt') {
        p.curve([-r * 0.3, -r * 1.2, -r * 0.5, -r * 1.6, -r * 0.2, -r * 2.0]);
        p.curve([r * 0.3, -r * 1.2, r * 0.1, -r * 1.6, r * 0.4, -r * 2.0]);
      }
      break;
    case 'milk':
      p.poly([-r * 0.22, -r * 0.8, r * 0.22, -r * 0.8, r * 0.22, -r * 0.25, -r * 0.22, -r * 0.25], HL.white);
      p.poly([-r * 0.5, -r * 0.25, r * 0.5, -r * 0.25, r * 0.5, r, -r * 0.5, r], HL.white);
      p.line(-r * 0.5, r * 0.2, r * 0.5, r * 0.2);
      break;
    case 'calc':
      p.poly([-r * 0.7, -r, r * 0.7, -r, r * 0.7, r, -r * 0.7, r], HL.gray);
      p.poly([-r * 0.45, -r * 0.75, r * 0.45, -r * 0.75, r * 0.45, -r * 0.3, -r * 0.45, -r * 0.3], HL.green);
      for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) p.dot(-r * 0.3 + k * r * 0.6, r * 0.05 + i * r * 0.32, r * 0.09);
      break;
    case 'sock':
      p.poly([-r * 0.35, -r, r * 0.35, -r, r * 0.35, r * 0.3, r * 0.9, r * 0.5, r * 0.9, r, -r * 0.35, r], HL.pink);
      p.line(-r * 0.35, -r * 0.55, r * 0.35, -r * 0.55);
      break;
    case 'ink':
      p.circle(0, 0, r, 'rgba(70,35,110,.6)');
      break;
    case 'seed':
      p.ellipse(0, 0, r * 0.6, r, HL.green);
      break;
    case 'clock':
      p.circle(-r * 0.7, -r * 0.8, r * 0.35, HL.yellow);
      p.circle(r * 0.7, -r * 0.8, r * 0.35, HL.yellow);
      p.circle(0, 0, r, HL.white);
      p.line(0, 0, 0, -r * 0.6);
      p.line(0, 0, r * 0.4, r * 0.1);
      break;
    case 'mail':
      p.poly([-r, -r * 0.65, r, -r * 0.65, r, r * 0.65, -r, r * 0.65], HL.white);
      p.poly([-r, -r * 0.65, 0, r * 0.1, r, -r * 0.65], null, false);
      break;
    case 'slipper':
      p.ellipse(0, 0, r * 0.6, r * 1.2, HL.pink);
      p.width(3.4);
      p.line(-r * 0.6, -r * 0.25, r * 0.6, -r * 0.25);
      p.width(2.4);
      break;
    case 'pin':
      p.line(-r * 0.15, -r, -r * 0.15, r);
      p.line(r * 0.15, -r * 0.8, r * 0.15, r);
      p.curve([-r * 0.15, -r, 0, -r * 1.2, r * 0.15, -r * 0.8]);
      break;
    case 'wifi':
      p.curve([-r, r * 0.35, -r * 0.5, -r * 0.2, 0, -r * 0.35, r * 0.5, -r * 0.2, r, r * 0.35]);
      p.dot(0, r * 0.35, r * 0.18);
      break;
    default:
      p.circle(0, 0, r, HL.red);
  }
}

// ───────────── EXTRAS ─────────────
export function drawFlame(p, r, t) {
  const L = r * (1.45 + 0.25 * Math.sin(t * 33));
  p.poly([-r * 0.24, r * 0.95, 0, L, r * 0.24, r * 0.95], HL.orange);
  p.poly([-r * 0.1, r * 0.98, 0, r * 0.98 + (L - r) * 0.5, r * 0.1, r * 0.98], HL.yellow);
}

export function drawHat(p, r) {
  p.poly([-r * 0.38, -r * 0.8, r * 0.38, -r * 0.8, r * 0.34, -r * 1.38, -r * 0.34, -r * 1.38], HL.dark);
  p.width(3.4);
  p.line(-r * 0.66, -r * 0.8, r * 0.66, -r * 0.8);
  p.width(2.4);
  p.line(-r * 0.37, -r * 0.92, r * 0.37, -r * 0.92);
}

export const PICKUP_LABEL = {
  calcetines: 'CALCETINES',
  gravedad: 'GRAVEDAD',
  comicsans: 'COMIC SANS',
  baguette: 'BAGUETTE',
  croqueta: '+1 VIDA',
};

export function drawPickup(p, kind) {
  if (kind === 'croquetita') {
    p.ellipse(0, 0, 13, 8, HL.brown);
    p.dot(-4, -1, 1.4);
    p.dot(3, 2, 1.4);
    return;
  }
  p.circle(0, 0, 22, 'rgba(255,255,255,.75)');
  switch (kind) {
    case 'calcetines':
      drawProjectile(p, { kind: 'sock', r: 10 });
      break;
    case 'gravedad':
      p.line(-6, 12, -6, -12);
      p.poly([-11, -6, -6, -13, -1, -6], null, false);
      p.line(6, -12, 6, 12);
      p.poly([1, 6, 6, 13, 11, 6], null, false);
      break;
    case 'comicsans':
      p.ctx.font = 'bold 20px "Comic Sans MS","Comic Sans","Chalkboard SE",cursive';
      p.ctx.textAlign = 'center';
      p.ctx.textBaseline = 'middle';
      p.ctx.fillStyle = p.color;
      p.ctx.fillText('Aa', 0, 1);
      break;
    case 'baguette':
      p.ctx.save();
      p.ctx.rotate(0.7);
      SPRITES.baguette(p, 13, 0);
      p.ctx.restore();
      break;
    case 'croqueta':
      p.ellipse(0, 2, 13, 8, HL.brown);
      p.text('+1', 0, -10, 14);
      break;
  }
  p.text(PICKUP_LABEL[kind] || '', 0, 33, 14);
}

export function drawBubble(pen, x, y, text, size = 17, o = {}) {
  const c = pen.ctx;
  c.font = `${size}px ${FONT}`;
  const W = o.W || 9999;
  const w = Math.min(W - 16, c.measureText(text).width + 18);
  const hgt = size + 12;
  // la caja se queda dentro de la pantalla; el piquito sigue apuntando al que habla
  const bx = Math.max(8, Math.min(W - 8 - w, x - w / 2));
  const tx = Math.max(bx + 12, Math.min(bx + w - 12, x));
  const fill = 'rgba(255,255,255,.95)';
  if (o.up) {
    const by = y + 10;
    pen.poly([bx, by, tx - 4, by, tx, y, tx + 8, by, bx + w, by, bx + w, by + hgt, bx, by + hgt], fill);
    pen.text(text, bx + w / 2, by + hgt / 2 + 1, size);
  } else {
    const by = y - hgt;
    pen.poly([bx, by, bx + w, by, bx + w, by + hgt, tx + 8, by + hgt, tx, by + hgt + 10, tx - 4, by + hgt, bx, by + hgt], fill);
    pen.text(text, bx + w / 2, by + hgt / 2 + 1, size);
  }
}

export { INK, RED, BLACK };
