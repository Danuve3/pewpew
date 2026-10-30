// Personajes, enemigos, jefes, power-ups y reglas absurdas.

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ───────────── PERSONAJES ─────────────
export const CHARACTERS = [
  {
    id: 'michi',
    name: 'Michi Láser',
    sprite: 'michi',
    r: 24,
    speed: 310,
    lives: 3,
    weapon: 'laser',
    scoreMul: 1,
    stat: 'Rápido · láser doble',
    desc: 'Dispara láser por los ojos. No sabe por qué. Nadie lo sabe.',
    epitaph: 'Tenía 7 vidas, pero solo se acordaba de 3.',
  },
  {
    id: 'tostadora',
    name: 'Tostadora Kamikaze',
    sprite: 'tostadora',
    r: 24,
    speed: 265,
    lives: 3,
    weapon: 'toast',
    scoreMul: 1,
    stat: 'Abanico · tostada quemada',
    desc: 'Dispara tostadas en abanico. Cada 8 ráfagas, una TOSTADA QUEMADA que lo atraviesa todo.',
    epitaph: 'Se le olvidó desenchufarse.',
  },
  {
    id: 'vaca',
    name: 'Vaca Abducida',
    sprite: 'vaca',
    r: 28,
    speed: 215,
    lives: 5,
    weapon: 'milk',
    scoreMul: 1,
    stat: 'Lenta · 5 vidas · salpica',
    desc: 'La abdujeron y se quedó con la nave. Lanza botellas de leche que salpican.',
    epitaph: 'Volvió al establo. Por fin.',
  },
  {
    id: 'pinguino',
    name: 'Pingüino Contable',
    sprite: 'pinguino',
    r: 22,
    speed: 285,
    lives: 3,
    weapon: 'calc',
    scoreMul: 1.25,
    stat: 'Teledirigido · +25% puntos',
    desc: 'Lanza calculadoras teledirigidas. Lleva las cuentas: +25% de puntos.',
    epitaph: 'Las cuentas no le salían.',
  },
];

// ───────────── REGLAS DE LA PARTIDA ─────────────
export const MODS = [
  { id: 'viento', name: 'Viento de levante', desc: 'Todo se desliza hacia un lado. Cambia cada 10 segundos.' },
  { id: 'sombreros', name: 'Día del sombrero', desc: 'Los enemigos llevan chistera: más duros y dan puntos dobles.' },
  { id: 'xxl', name: 'Balas XXL', desc: 'Todos los proyectiles, los tuyos y los suyos, son enormes.' },
  { id: 'hipo', name: 'Hipo', desc: 'Tu nave tiene hipo. No hay nada que hacer.' },
  { id: 'pollitos', name: 'Temporada de huevos', desc: 'Huevos por todas partes. Respeta a los pollitos.' },
  { id: 'cafe', name: 'Tercer café', desc: 'Todo va un 25% más rápido. Puntos x1,5.' },
  { id: 'espejo', name: 'Modo espejo', desc: 'Izquierda es derecha. Buena suerte.' },
  { id: 'gigantes', name: 'Enemigos XXL', desc: 'Los enemigos son enormes, aunque algo más lentos.' },
];

export function rollMods() {
  const n = Math.random() < 0.35 ? 2 : 1;
  return shuffle(MODS).slice(0, n);
}

// ───────────── POWER-UPS ─────────────
export const POWERUPS = {
  calcetines: { dur: 8, w: 3, shout: '¡LLUVIA DE CALCETINES!' },
  gravedad: { dur: 8, w: 2, shout: '¡ARRIBA ES ABAJO! Puntos x2' },
  comicsans: { dur: 9, w: 2, shout: 'MODO COMIC SANS: los enemigos se avergüenzan' },
  baguette: { dur: 6, w: 2, shout: '¡ERES UNA BAGUETTE INVENCIBLE!' },
  croqueta: { dur: 0, w: 1.5, shout: '¡CROQUETA! +1 VIDA' },
};

export const ONOS = ['¡PLOF!', '¡ÑAC!', '¡CATAPLÁN!', '¡POF!', '¡BLAM!', '¡CHOF!', '¡PAF!', '¡ZAS!'];
export const WAVE_SUBS = [
  'Vienen los de siempre',
  'Esto se pone serio (no)',
  'Patrocinado por nadie',
  'Ahora con más pato',
  '¿Has cerrado el gas?',
  'Edición coleccionista',
  'La venganza del brócoli',
  'Nadie sabe de dónde salen',
  'Música de ascensor',
  'Versión del director',
];

// ───────────── ENEMIGOS ─────────────
// update(e, dt, g): g expone W, H, player, diff, eMul, aim(), enemyFire(),
// say(), spawnEnemy(). Las velocidades de balas enemigas ya se escalan
// con g.eMul al moverse, así que aquí solo se usa g.diff.
export const ENEMIES = {
  pato: {
    r: 20, hp: 1, points: 100, spawnable: true, ono: ['¡CUAC!', '¡PLOF!'],
    init(e, g) {
      e.data.state = 'in';
      e.data.stopY = rand(g.H * 0.1, g.H * 0.32);
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      const d = e.data;
      if (d.state === 'in') {
        e.y += 150 * m * dt;
        e.x += Math.sin(e.t * 4) * 30 * dt;
        if (e.y >= d.stopY) {
          d.state = 'wait';
          d.w = rand(0.4, 1);
        }
      } else if (d.state === 'wait') {
        d.w -= dt * m;
        e.rot = Math.sin(e.t * 30) * 0.15;
        if (d.w <= 0) {
          d.state = 'dive';
          const a = g.aim(e.x, e.y, 390);
          e.vx = a.vx;
          e.vy = Math.max(a.vy, 140);
          e.rot = Math.atan2(e.vy, e.vx) - Math.PI / 2;
          if (Math.random() < 0.6) g.say(e, '¡CUAC!', 0.9);
        }
      } else {
        e.x += e.vx * m * dt;
        e.y += e.vy * m * dt;
      }
    },
  },

  pulpo: {
    r: 22, hp: 3, points: 200, spawnable: true, ono: ['¡GLUB!', '¡SPLASH!'],
    init(e, g) {
      e.data.baseX = clamp(e.x, 80, g.W - 80);
      e.data.stopY = rand(g.H * 0.12, g.H * 0.35);
      e.data.fire = rand(0.8, 1.8);
      e.data.life = rand(9, 13);
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      const d = e.data;
      if (e.t > d.life) e.y += 110 * m * dt;
      else if (e.y < d.stopY) e.y += 95 * m * dt;
      e.x = d.baseX + Math.sin(e.t * 1.4 * g.eMul) * 65;
      d.fire -= dt * g.eMul;
      if (d.fire <= 0 && e.y > 10) {
        d.fire = rand(1.8, 2.6) / g.diff;
        const a = g.aim(e.x, e.y, 190 * g.diff);
        g.enemyFire(e.x, e.y + e.r * 0.5, a.vx, a.vy, 'ink', { r: 7 });
        if (Math.random() < 0.2) g.say(e, 'glub', 0.8);
      }
    },
  },

  brocoli: {
    r: 20, hp: 2, points: 150, spawnable: true, ono: ['¡CRUNCH!', '¡ÑAM!'],
    init(e, g) {
      e.data.dir = Math.random() < 0.5 ? -1 : 1;
      e.data.sw = rand(0.5, 1);
      e.data.fire = rand(1, 2);
      if (Math.random() < 0.3) g.say(e, '¡Cómeme si puedes!', 1.6);
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      const d = e.data;
      e.y += 70 * m * dt;
      e.x += d.dir * 100 * m * dt;
      d.sw -= dt;
      if (d.sw <= 0 || e.x < e.r || e.x > g.W - e.r) {
        d.dir *= -1;
        d.sw = rand(0.6, 1.1);
        e.x = clamp(e.x, e.r, g.W - e.r);
      }
      d.fire -= dt * g.eMul;
      if (d.fire <= 0 && e.y > 10) {
        d.fire = rand(1.7, 2.5) / g.diff;
        for (const a of [-0.25, 0, 0.25]) {
          g.enemyFire(e.x, e.y + e.r, Math.sin(a) * 200 * g.diff, Math.cos(a) * 200 * g.diff, 'seed', { r: 5 });
        }
      }
    },
  },

  pizza: {
    r: 26, hp: 3, points: 250, spawnable: true, ono: ['¡ÑAM!', '¡CRACK!'],
    init(e) {
      e.data.ph = rand(0, 6);
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      e.y += 55 * m * dt;
      e.x += Math.sin(e.t * 1.5 + e.data.ph) * 40 * dt;
      e.rot += 0.6 * dt;
    },
    onDie(e, g) {
      for (const [vx, vy] of [[-170, 40], [0, 160], [170, 40]]) {
        g.spawnEnemy('slice', e.x, e.y, { vx, vy });
      }
    },
  },

  slice: {
    r: 14, hp: 1, points: 60, spawnable: false, ono: ['¡ÑAC!'],
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      e.vy += 140 * dt;
      e.x += e.vx * m * dt;
      e.y += e.vy * m * dt;
      e.rot = Math.atan2(e.vy, e.vx) - Math.PI / 2;
    },
  },

  cabra: {
    r: 22, hp: 2, points: 180, spawnable: true, ono: ['¡BEEEE!', '¡MEEEC!'],
    init(e) {
      e.vx = (Math.random() < 0.5 ? -1 : 1) * rand(110, 165);
      e.vy = rand(75, 95);
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      e.x += e.vx * m * dt;
      e.y += e.vy * m * dt;
      if ((e.x < e.r && e.vx < 0) || (e.x > g.W - e.r && e.vx > 0)) {
        e.vx *= -1;
        if (Math.random() < 0.35) g.say(e, 'BEEEEE', 0.8);
      }
      e.rot = Math.sin(e.t * 8) * 0.12;
    },
  },

  platano: {
    r: 20, hp: 2, points: 170, spawnable: true, ono: ['¡SPLAT!', '¡PLAF!'],
    init(e) {
      e.data.v0 = rand(280, 330);
      e.data.vx = rand(-70, 70);
      e.data.turned = false;
    },
    update(e, dt, g) {
      const m = g.eMul * g.diff;
      const d = e.data;
      const vy = d.v0 - 240 * e.t * g.eMul;
      e.y += vy * m * dt;
      e.x += d.vx * m * dt;
      e.rot += 9 * dt;
      if (!d.turned && vy < 0) {
        d.turned = true;
        g.say(e, '¡Vuelvo!', 1);
        const a = g.aim(e.x, e.y, 220 * g.diff);
        g.enemyFire(e.x, e.y, a.vx, a.vy, 'blob', { r: 6 });
      }
      if (e.t > 1 && e.y < -60) e.gone = true;
    },
  },

  huevo: {
    r: 18, hp: 1, points: 50, spawnable: true, ono: ['¡CRAC!'],
    init(e, g) {
      if (Math.random() < 0.2) g.say(e, '¿Qué fue antes?', 1.5);
    },
    update(e, dt, g) {
      e.y += 65 * g.eMul * g.diff * dt;
      e.rot = Math.sin(e.t * 3) * 0.2;
    },
    onDie(e, g) {
      g.spawnEnemy('pollito', e.x, e.y);
    },
  },

  pollito: {
    r: 12, hp: 1, points: 0, spawnable: false, friendly: true, ono: ['pío'],
    init(e, g) {
      e.data.dir = e.x < g.W / 2 ? -1 : 1;
      g.say(e, 'pío', 0.8);
    },
    update(e, dt) {
      e.x += e.data.dir * 170 * dt;
      e.y += 15 * dt + Math.sin(e.t * 25) * 0.6;
    },
  },
};

// ───────────── JEFES ─────────────
const enterBoss = (e, dt, g) => {
  const ty = Math.max(g.H * 0.22, (g.safeTop || 0) + 110 + e.r * 0.9);
  if (e.y < ty) {
    e.y = Math.min(ty, e.y + 90 * dt);
    return true;
  }
  return false;
};

export const BOSSES = {
  lunes: {
    name: 'EL LUNES',
    sub: 'Llega todas las semanas. Y no trae café.',
    r: 68,
    quotes: ['Reunión a las 8', '¿Has visto mi email?', 'Esto lo hablamos el lunes', '¡QUE EL LUNES SOY YO!', 'Te pongo en copia'],
    init(e) {
      Object.assign(e.data, { vol: 1.5, mail: 3, q: 1 });
    },
    update(e, dt, g) {
      const d = e.data;
      d.q -= dt;
      if (d.q <= 0) {
        d.q = rand(4, 7);
        g.say(e, pick(this.quotes), 2.2);
      }
      if (enterBoss(e, dt, g)) return;
      const m = g.eMul;
      d.ph = (d.ph || 0) + dt * 0.7 * m;
      e.x = g.W / 2 + Math.sin(d.ph) * (g.W / 2 - e.r - 8);
      const rage = e.hp < e.maxHp / 2 ? 1.5 : 1;
      d.vol -= dt * rage * m;
      if (d.vol <= 0) {
        d.vol = 1.8;
        const n = 7;
        for (let i = 0; i < n; i++) {
          const a = (i / (n - 1) - 0.5) * 1.4;
          g.enemyFire(e.x, e.y + e.r * 0.6, Math.sin(a) * 165, Math.cos(a) * 165, 'clock', { r: 10, spin: 2 });
        }
      }
      d.mail -= dt * rage * m;
      if (d.mail <= 0) {
        d.mail = 2.8;
        const a0 = g.aim(e.x, e.y, 1);
        const base = Math.atan2(a0.vx, a0.vy);
        for (const s of [-0.15, 0, 0.15]) {
          g.enemyFire(e.x, e.y + e.r * 0.5, Math.sin(base + s) * 230, Math.cos(base + s) * 230, 'mail', { r: 9 });
        }
      }
    },
  },

  abuela: {
    name: 'LA ABUELA',
    sub: 'Viene a darte de comer. A la fuerza.',
    r: 66,
    quotes: ['¿Has comido?', '¡Estás muy delgado!', 'Ponte una chaqueta', '¿Y novia pa cuándo?', 'Toma, pa la merienda', '¡Qué mayor estás!'],
    init(e) {
      Object.assign(e.data, { tx: e.x, mv: 0, sl: 1.5, cq: 2.5, ring: 3, q: 1 });
    },
    update(e, dt, g) {
      const d = e.data;
      d.q -= dt;
      if (d.q <= 0) {
        d.q = rand(3.5, 6);
        g.say(e, pick(this.quotes), 2);
      }
      if (enterBoss(e, dt, g)) return;
      const m = g.eMul;
      d.mv -= dt;
      if (d.mv <= 0) {
        d.mv = rand(1.5, 2.5);
        d.tx = rand(e.r, g.W - e.r);
      }
      e.x += (d.tx - e.x) * Math.min(1, dt * 1.5 * m);
      const rage = e.hp < e.maxHp / 2;
      d.sl -= dt * m;
      if (d.sl <= 0) {
        d.sl = rage ? 0.9 : 1.3;
        const a = g.aim(e.x, e.y, 240);
        g.enemyFire(e.x, e.y + e.r * 0.4, a.vx, a.vy, 'slipper', { r: 11, spin: 9 });
      }
      d.cq -= dt * m;
      if (d.cq <= 0) {
        d.cq = 3;
        for (const vx of [-90, 0, 90]) g.spawnPickup(e.x, e.y + e.r * 0.6, 'croquetita', { vx });
      }
      if (rage) {
        d.ring -= dt * m;
        if (d.ring <= 0) {
          d.ring = 2.4;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + e.t;
            g.enemyFire(e.x, e.y, Math.cos(a) * 140, Math.sin(a) * 140, 'pin', { r: 8, rot: Math.atan2(Math.sin(a), Math.cos(a)) + Math.PI / 2 });
          }
        }
      }
    },
  },

  router: {
    name: 'EL ROUTER DEL QUINTO',
    sub: 'Lleva tres años sin reiniciarse.',
    r: 62,
    quotes: ['Contraseña: 1234', 'Conexión inestable', '¿Has probado a apagarme?', 'Actualizando firmware...', 'Hay 47 dispositivos conectados'],
    init(e) {
      Object.assign(e.data, { ring: 2, tp: 6, lag: 5, q: 1, off: 0 });
    },
    update(e, dt, g) {
      const d = e.data;
      d.q -= dt;
      if (d.q <= 0) {
        d.q = rand(4, 7);
        g.say(e, pick(this.quotes), 2);
      }
      if (enterBoss(e, dt, g)) return;
      const m = g.eMul;
      e.rot = Math.sin(e.t * 2) * 0.05;
      d.ring -= dt * m;
      if (d.ring <= 0) {
        d.ring = e.hp < e.maxHp / 2 ? 1.4 : 2;
        d.off += 0.13;
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + d.off;
          g.enemyFire(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, 'wifi', { r: 10, rot: a + Math.PI / 2 });
        }
      }
      d.tp -= dt * m;
      if (d.tp <= 0) {
        d.tp = rand(5, 7);
        g.say(e, 'Reiniciando...', 1.2);
        g.burst(e.x, e.y, '#888', 14);
        e.x = rand(e.r, g.W - e.r);
        g.burst(e.x, e.y, '#888', 14);
      }
      d.lag -= dt * m;
      if (d.lag <= 0) {
        d.lag = rand(8, 10);
        g.lag = 2.2;
      }
    },
  },
};

// Reparto de power-ups cuando cae uno
export function rollPowerup(lives, maxLives) {
  const entries = Object.entries(POWERUPS).filter(([k]) => k !== 'croqueta' || lives < maxLives);
  let total = entries.reduce((s, [, v]) => s + v.w, 0);
  let x = Math.random() * total;
  for (const [k, v] of entries) {
    x -= v.w;
    if (x <= 0) return k;
  }
  return entries[0][0];
}
