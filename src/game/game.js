import { Pen, INK, RED, BLACK, PENCIL, HL, FONT, setComic } from './doodle.js';
import { SPRITES, drawProjectile, drawPickup, drawFlame, drawHat, drawBubble } from './sprites.js';
import {
  CHARACTERS, ENEMIES, BOSSES, POWERUPS, ONOS, WAVE_SUBS,
  rand, pick, shuffle, rollPowerup,
} from './content.js';

const MAX_LIVES = 6;
let SEED = 1;

const DOODLE_KINDS = ['star', 'spiral', 'heart', 'pew', 'math', 'smile', 'cube', 'arrow', 'flower', 'exam', 'ufo'];

export class Game {
  constructor(canvas, audio, hooks = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.pen = new Pen(this.ctx);
    this.audio = audio;
    this.hooks = hooks;
    this.running = false;
    this.paused = false;
    this.raf = 0;
    this.keys = new Set();
    this.t = 0;
    this.loop = this.loop.bind(this);
    this.bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  // ───────────── PANTALLA ─────────────
  resize() {
    this.W = Math.min(window.innerWidth, 560);
    this.H = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.c.width = Math.round(this.W * this.dpr);
    this.c.height = Math.round(this.H * this.dpr);
    this.c.style.width = this.W + 'px';
    this.c.style.height = this.H + 'px';
    const sat = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
    this.safeTop = sat;
    if (this.player) this.clampPlayer();
    if (!this.running || this.paused) this.render();
  }

  // ───────────── CONTROLES ─────────────
  bindInput() {
    const c = this.c;
    c.addEventListener('pointerdown', (e) => {
      if (!this.running || this.paused) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { c.setPointerCapture(e.pointerId); } catch { /* da igual */ }
      e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.moveTarget(dx * 1.3, dy * 1.3);
    });
    const end = (e) => {
      if (this.drag && e.pointerId === this.drag.id) this.drag = null;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.running) return;
      if (k === 'p' || k === 'escape') {
        this.hooks.onPauseRequest?.();
        return;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  moveTarget(dx, dy) {
    const p = this.player;
    if (!p) return;
    if (this.mods.has('espejo')) dx = -dx;
    if (this.flip) dy = -dy;
    p.target.x += dx;
    p.target.y += dy;
    this.clampTarget();
  }

  clampTarget() {
    const p = this.player;
    p.target.x = Math.max(p.r, Math.min(this.W - p.r, p.target.x));
    p.target.y = Math.max(this.H * 0.18, Math.min(this.H - p.r * 1.4, p.target.y));
  }

  clampPlayer() {
    const p = this.player;
    this.clampTarget();
    p.x = Math.max(p.r, Math.min(this.W - p.r, p.x));
    p.y = Math.max(this.H * 0.18, Math.min(this.H - p.r * 1.4, p.y));
  }

  // ───────────── CICLO DE VIDA ─────────────
  start(charId, mods) {
    this.char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    this.modList = mods;
    this.mods = new Set(mods.map((m) => m.id));
    setComic(false);
    this.flip = false;
    this.t = 0;
    this.score = 0;
    this.wave = 0;
    this.diff = 1;
    this.stats = { kills: 0, pollitosKilled: 0, pollitosSaved: 0, bosses: 0, powerups: 0, shots: 0 };
    const r = this.char.r;
    this.player = {
      x: this.W / 2, y: this.H * 0.8, r,
      lives: this.char.lives, inv: 2, fireT: 0.6, volleys: 0,
      pu: null, hipT: rand(3, 6), dead: false, tilt: 0, seed: SEED++,
    };
    this.player.target = { x: this.player.x, y: this.player.y };
    this.hist = [];
    this.enemies = [];
    this.bullets = [];
    this.ebullets = [];
    this.pickups = [];
    this.parts = [];
    this.texts = [];
    this.queue = [];
    this.spawnT = 0;
    this.waveDelay = 0;
    this.banner = null;
    this.pendingBoss = null;
    this.shout = null;
    this.lag = 0;
    this.shake = 0;
    this.timeScale = 1;
    this.deadT = 0;
    this.lastEShot = -1;
    this.pool = shuffle(Object.keys(ENEMIES).filter((k) => ENEMIES[k].spawnable));
    this.bossOrder = shuffle(Object.keys(BOSSES));
    this.bossCount = 0;
    this.wind = this.mods.has('viento') ? (Math.random() < 0.5 ? -70 : 70) : 0;
    this.windT = 10;
    this.makeDoodles();
    this.running = true;
    this.paused = false;
    this.nextWave();
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.loop);
  }

  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.keys.clear();
    this.drag = null;
    cancelAnimationFrame(this.raf);
    this.render();
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    this.paused = false;
    cancelAnimationFrame(this.raf);
    setComic(false);
    this.flip = false;
  }

  loop(ts) {
    if (!this.running || this.paused) return;
    const real = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    const speed = this.mods.has('cafe') ? 1.25 : 1;
    this.update(real * this.timeScale * speed, real);
    if (!this.running) return;
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ───────────── API PARA LOS ENEMIGOS ─────────────
  get eMul() {
    let m = 1;
    if (this.player?.pu?.id === 'comicsans') m *= 0.5;
    if (this.mods.has('gigantes')) m *= 0.8;
    return m;
  }

  aim(x, y, speed) {
    const p = this.player;
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.hypot(dx, dy) || 1;
    return { vx: (dx / d) * speed, vy: (dy / d) * speed };
  }

  enemyFire(x, y, vx, vy, kind = 'blob', o = {}) {
    const xxl = this.mods.has('xxl') ? 1.8 : 1;
    this.ebullets.push({
      x, y, vx, vy, kind,
      r: (o.r || 6) * xxl,
      rot: o.rot ?? 0,
      spin: o.spin || 0,
      seed: SEED++,
    });
    if (this.t - this.lastEShot > 0.1) {
      this.lastEShot = this.t;
      this.audio.play('enemyShoot');
    }
  }

  say(e, text, dur = 1.6) {
    if (!text) return;
    e.bubble = { text, time: dur };
  }

  text(x, y, str, o = {}) {
    this.texts.push({
      x, y, str,
      size: o.size || 22,
      color: o.color || INK,
      life: o.life || 0.9,
      max: o.life || 0.9,
      vy: o.vy ?? -45,
      rot: o.rot ?? rand(-0.2, 0.2),
    });
  }

  burst(x, y, color = RED, n = 10, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(speed * 0.3, speed);
      this.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(0.3, 0.75), max: 0.75, len: rand(5, 14), color,
      });
    }
  }

  spawnEnemy(type, x, y, init = {}) {
    const d = ENEMIES[type];
    const big = this.mods.has('gigantes') && !d.friendly ? 1.45 : 1;
    const hat = this.mods.has('sombreros') && !d.friendly;
    const e = {
      type, x, y, vx: 0, vy: 0, rot: 0, t: 0,
      r: d.r * big, hp: d.hp + (hat ? 1 : 0),
      seed: SEED++, data: {}, hat, friendly: !!d.friendly, flash: 0,
      ...init,
    };
    e.maxHp = e.hp;
    d.init?.(e, this);
    this.enemies.push(e);
    return e;
  }

  spawnBoss(type) {
    const B = BOSSES[type];
    const lap = Math.floor((this.bossCount - 1) / 3);
    const hp = Math.round((50 + this.wave * 10) * (1 + lap * 0.6));
    const e = {
      type, boss: true, x: this.W / 2, y: -B.r - 20, vx: 0, vy: 0, rot: 0, t: 0,
      r: B.r, hp, maxHp: hp, seed: SEED++, data: {}, flash: 0, name: B.name,
    };
    B.init?.(e, this);
    this.enemies.push(e);
  }

  spawnPickup(x, y, kind, o = {}) {
    this.pickups.push({ x, y, kind, t: 0, vx: o.vx || 0, vy: kind === 'croquetita' ? 120 : 75, seed: SEED++ });
  }

  // ───────────── OLEADAS ─────────────
  nextWave() {
    this.wave++;
    this.diff = 1 + (this.wave - 1) * 0.06;
    if (this.wave % 4 === 0) {
      const type = this.bossOrder[this.bossCount % this.bossOrder.length];
      this.bossCount++;
      this.pendingBoss = type;
      this.banner = { title: `¡JEFE! ${BOSSES[type].name}`, sub: BOSSES[type].sub, time: 2.8, max: 2.8 };
      this.audio.play('bossAppear');
      return;
    }
    const n = 6 + this.wave * 2;
    const size = Math.min(this.pool.length, 2 + Math.floor(this.wave * 0.8));
    const avail = this.pool.slice(0, size);
    const eggs = this.mods.has('pollitos');
    if (eggs && !avail.includes('huevo')) avail.push('huevo');
    const gap = Math.max(0.35, 1.05 - this.wave * 0.05);
    this.queue = [];
    while (this.queue.length < n) {
      let type = eggs && Math.random() < 0.35 ? 'huevo' : pick(avail);
      if (Math.random() < 0.25) {
        const k = 3 + Math.floor(Math.random() * 2);
        const span = this.W - 80;
        const x0 = 40 + Math.random() * (span - (k - 1) * 55);
        for (let i = 0; i < k; i++) this.queue.push({ type, x: x0 + i * 55, gap: i === k - 1 ? gap : 0.15 });
      } else {
        this.queue.push({ type, gap });
      }
    }
    this.spawnT = 0.3;
    this.banner = { title: `Oleada ${this.wave}`, sub: pick(WAVE_SUBS), time: 2, max: 2 };
  }

  updateWaves(dt) {
    if (this.banner) {
      this.banner.time -= dt;
      if (this.banner.time > 0) return;
      this.banner = null;
      if (this.pendingBoss) {
        this.spawnBoss(this.pendingBoss);
        this.pendingBoss = null;
      }
    }
    if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const q = this.queue.shift();
        const x = q.x ?? rand(40, this.W - 40);
        this.spawnEnemy(q.type, x, -40);
        this.spawnT = q.gap;
      }
    } else if (!this.enemies.some((e) => !e.friendly)) {
      this.waveDelay += dt;
      if (this.waveDelay > 1.2) {
        this.waveDelay = 0;
        this.nextWave();
      }
    }
  }

  // ───────────── JUGADOR ─────────────
  updatePlayer(dt) {
    const p = this.player;
    const ch = this.char;
    let kx = 0;
    let ky = 0;
    const K = this.keys;
    if (K.has('arrowleft') || K.has('a')) kx -= 1;
    if (K.has('arrowright') || K.has('d')) kx += 1;
    if (K.has('arrowup') || K.has('w')) ky -= 1;
    if (K.has('arrowdown') || K.has('s')) ky += 1;
    if (kx || ky) {
      const sp = ch.speed * (p.pu?.id === 'baguette' ? 1.2 : 1) * dt;
      const n = Math.hypot(kx, ky);
      this.moveTarget((kx / n) * sp, (ky / n) * sp);
    }

    if (this.wind) {
      p.target.x += this.wind * dt;
      this.clampTarget();
      this.windT -= dt;
      if (this.windT <= 0) {
        this.windT = 10;
        this.wind = -this.wind;
        this.text(this.W / 2, this.H * 0.45, this.wind > 0 ? 'viento → → →' : '← ← ← viento', { size: 26, color: PENCIL, life: 1.4, vy: 0 });
      }
    }

    if (this.mods.has('hipo')) {
      p.hipT -= dt;
      if (p.hipT <= 0) {
        p.hipT = rand(3, 7);
        p.target.y -= 55;
        p.y -= 55;
        this.clampPlayer();
        this.text(p.x, p.y - p.r * 1.5, '¡HIP!', { size: 24 });
      }
    }

    this.hist.push({ t: this.t, x: p.target.x, y: p.target.y });
    while (this.hist.length && this.hist[0].t < this.t - 1) this.hist.shift();
    let tg = p.target;
    if (this.lag > 0) {
      const old = this.hist.find((h) => h.t >= this.t - 0.55);
      if (old) tg = old;
    }

    const dx = tg.x - p.x;
    const dy = tg.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, ch.speed * 2.6 * dt);
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
    p.tilt += (Math.max(-0.35, Math.min(0.35, dx * 0.012)) - p.tilt) * Math.min(1, dt * 10);
    this.clampPlayer();

    p.inv = Math.max(0, p.inv - dt);
    if (p.pu && p.pu.time > 0) {
      p.pu.time -= dt;
      if (p.pu.time <= 0) this.endPowerup();
    }

    p.fireT -= dt;
    if (p.fireT <= 0 && p.pu?.id !== 'baguette') this.fire();
  }

  fire() {
    const p = this.player;
    const xxl = this.mods.has('xxl') ? 1.8 : 1;
    const w = p.pu?.id === 'calcetines' ? 'socks' : this.char.weapon;
    const B = (x, y, ang, speed, o) => this.bullets.push({
      x, y, vx: Math.sin(ang) * speed, vy: -Math.cos(ang) * speed, rot: ang,
      r: (o.r || 5) * xxl, dmg: o.dmg || 1, kind: o.kind, pierce: o.pierce || 0,
      homing: o.homing || 0, splash: o.splash || 0, life: 3, seed: SEED++, hit: null,
    });
    let rate = 0.3;
    switch (w) {
      case 'laser':
        B(p.x - p.r * 0.28, p.y - p.r * 0.4, 0, 650, { kind: 'laser', r: 4 });
        B(p.x + p.r * 0.28, p.y - p.r * 0.4, 0, 650, { kind: 'laser', r: 4 });
        rate = 0.17;
        break;
      case 'toast':
        p.volleys++;
        if (p.volleys % 8 === 0) {
          B(p.x, p.y - p.r * 0.6, 0, 380, { kind: 'burnt', r: 15, dmg: 3, pierce: 4 });
          this.text(p.x, p.y - p.r * 2, '¡QUEMADA!', { size: 20 });
        } else {
          for (const a of [-0.22, 0, 0.22]) B(p.x, p.y - p.r * 0.6, a, 430, { kind: 'toast', r: 7 });
        }
        rate = 0.32;
        break;
      case 'milk':
        B(p.x, p.y - p.r, 0, 360, { kind: 'milk', r: 10, dmg: 3, splash: 55 });
        rate = 0.42;
        break;
      case 'calc':
        B(p.x - 10, p.y - 10, -0.5, 370, { kind: 'calc', r: 7, homing: 5 });
        B(p.x + 10, p.y - 10, 0.5, 370, { kind: 'calc', r: 7, homing: 5 });
        rate = 0.28;
        break;
      case 'socks':
        for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) B(p.x, p.y - p.r * 0.5, a, 450, { kind: 'sock', r: 7 });
        rate = 0.24;
        break;
    }
    p.fireT = rate;
    this.stats.shots++;
    this.audio.play('shoot');
  }

  hurtPlayer() {
    const p = this.player;
    if (p.dead || p.inv > 0 || p.pu?.id === 'baguette') return;
    p.lives--;
    p.inv = 2;
    this.shake = 12;
    this.burst(p.x, p.y, INK, 14);
    if (p.lives <= 0) return this.die();
    this.audio.play('hurt');
    this.text(p.x, p.y - p.r * 1.6, pick(['¡AY!', '¡AUCH!', '-1', '¡MI MADRE!']), { size: 26, color: RED });
  }

  die() {
    const p = this.player;
    p.dead = true;
    this.endPowerup();
    this.audio.play('playerDie');
    this.burst(p.x, p.y, INK, 40, 380);
    this.burst(p.x, p.y, RED, 20, 260);
    this.text(p.x, p.y - 20, '¡NOOOOO!', { size: 40, color: RED, life: 2, vy: -20 });
    this.shake = 22;
    this.timeScale = 0.35;
    this.deadT = 2.4;
  }

  applyPickup(k, at) {
    const p = this.player;
    if (k === 'croquetita') {
      this.addScore(25, at.x, at.y);
      if (Math.random() < 0.35) this.text(at.x, at.y - 20, pick(['¡Qué rica!', 'Mmm…', 'Como las de antes']), { size: 18 });
      return;
    }
    this.audio.play('powerup');
    this.stats.powerups++;
    if (k === 'croqueta') {
      p.lives = Math.min(MAX_LIVES, p.lives + 1);
      this.shout = { text: POWERUPS.croqueta.shout, time: 1.6, max: 1.6 };
      return;
    }
    this.endPowerup();
    p.pu = { id: k, time: POWERUPS[k].dur, max: POWERUPS[k].dur };
    if (k === 'comicsans') setComic(true);
    if (k === 'gravedad') this.flip = true;
    this.shout = { text: POWERUPS[k].shout, time: 1.8, max: 1.8 };
  }

  endPowerup() {
    const p = this.player;
    if (!p?.pu) return;
    if (p.pu.id === 'comicsans') setComic(false);
    if (p.pu.id === 'gravedad') this.flip = false;
    p.pu = null;
  }

  // ───────────── PUNTOS Y MUERTES ─────────────
  addScore(n, x, y) {
    let mult = this.char.scoreMul;
    if (this.mods.has('cafe')) mult *= 1.5;
    if (this.flip) mult *= 2;
    const pts = Math.round(n * mult);
    this.score = Math.max(0, this.score + pts);
    if (x !== undefined && pts > 0) this.text(x, y, '+' + pts, { size: 16, color: PENCIL, life: 0.7 });
  }

  hitEnemy(e, dmg) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    e.dead = true;
    if (e.friendly) {
      this.score = Math.max(0, this.score - 100);
      this.stats.pollitosKilled++;
      this.audio.play('enemyDie', { filter: 'ardilla' });
      this.burst(e.x, e.y, '#d4b000', 10);
      this.text(e.x, e.y - 10, '¡ASESINO! -100', { size: 26, color: RED, life: 1.3 });
      return;
    }
    if (e.boss) {
      this.stats.bosses++;
      this.audio.play('bossDie');
      this.shake = 26;
      for (let i = 0; i < 4; i++) this.burst(e.x + rand(-40, 40), e.y + rand(-40, 40), BLACK, 18, 360);
      this.burst(e.x, e.y, RED, 30, 300);
      for (const b of this.ebullets) this.burst(b.x, b.y, RED, 2, 80);
      this.ebullets = [];
      this.addScore(1500 + this.wave * 100, e.x, e.y);
      this.text(e.x, e.y, '¡JEFE DERROTADO!', { size: 36, color: RED, life: 2.2, vy: -15 });
      this.spawnPickup(e.x - 30, e.y, rollPowerup(this.player.lives, MAX_LIVES));
      this.spawnPickup(e.x + 30, e.y, 'croqueta');
      return;
    }
    const d = ENEMIES[e.type];
    this.stats.kills++;
    this.addScore(d.points * (e.hat ? 2 : 1), e.x, e.y);
    this.audio.play('enemyDie');
    this.burst(e.x, e.y, RED, 12);
    this.text(e.x + rand(-10, 10), e.y - 14, pick(Math.random() < 0.5 ? d.ono : ONOS), { size: 22, color: RED });
    d.onDie?.(e, this);
    if (e.type !== 'slice' && Math.random() < 0.07) {
      this.spawnPickup(e.x, e.y, rollPowerup(this.player.lives, MAX_LIVES));
    }
  }

  // ───────────── ACTUALIZAR ─────────────
  update(dt, real) {
    this.t += dt;
    const p = this.player;
    const W = this.W;
    const H = this.H;

    this.updateWaves(dt);
    if (!p.dead) this.updatePlayer(dt);

    for (const e of this.enemies) {
      e.t += dt;
      (e.boss ? BOSSES : ENEMIES)[e.type].update(e, dt, this);
      if (e.bubble) {
        e.bubble.time -= dt;
        if (e.bubble.time <= 0) e.bubble = null;
      }
      if (e.flash > 0) e.flash -= dt;
    }

    // balas propias
    for (const b of this.bullets) {
      if (b.homing) {
        let best = null;
        let bd = 1e9;
        for (const e of this.enemies) {
          if (e.dead || e.friendly || e.y > b.y + 20) continue;
          const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2;
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const sp = Math.hypot(b.vx, b.vy);
          const cur = Math.atan2(b.vy, b.vx);
          const want = Math.atan2(best.y - b.y, best.x - b.x);
          let da = want - cur;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const na = cur + Math.max(-b.homing * dt, Math.min(b.homing * dt, da));
          b.vx = Math.cos(na) * sp;
          b.vy = Math.sin(na) * sp;
          b.rot = na + Math.PI / 2;
        }
      }
      if (b.kind === 'sock' || b.kind === 'toast') b.rot += 6 * dt;
      b.x += (b.vx + this.wind * 0.4) * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -50 || b.y > H + 50 || b.x < -50 || b.x > W + 50) b.dead = true;
    }

    // balas enemigas
    const em = this.eMul;
    for (const b of this.ebullets) {
      b.x += (b.vx * em + this.wind * 0.3) * dt;
      b.y += b.vy * em * dt;
      b.rot += b.spin * dt;
      if (b.y < -80 || b.y > H + 60 || b.x < -60 || b.x > W + 60) b.dead = true;
    }

    // recogibles
    for (const k of this.pickups) {
      k.t += dt;
      k.x += (k.vx + Math.sin(k.t * 3) * 25) * dt;
      k.vx *= 1 - Math.min(1, dt * 1.5);
      k.y += k.vy * dt;
      if (k.y > H + 40) k.dead = true;
    }

    // colisiones: tus balas contra enemigos
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || (b.hit && b.hit.has(e))) continue;
        const rr = b.r + e.r * 0.85;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 > rr * rr) continue;
        this.hitEnemy(e, b.dmg);
        if (b.splash) {
          this.burst(b.x, b.y, '#9ab', 10, 160);
          for (const o of this.enemies) {
            if (o !== e && !o.dead && !o.friendly && Math.hypot(o.x - b.x, o.y - b.y) < b.splash + o.r) this.hitEnemy(o, 1);
          }
        }
        if (b.pierce > 0) {
          b.pierce--;
          (b.hit ||= new Set()).add(e);
        } else {
          b.dead = true;
          break;
        }
      }
    }

    if (!p.dead) {
      const pr = p.r * 0.5;
      for (const b of this.ebullets) {
        if (b.dead) continue;
        const rr = b.r * 0.85 + pr;
        if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < rr * rr) {
          b.dead = true;
          this.hurtPlayer();
        }
      }
      const bag = p.pu?.id === 'baguette';
      for (const e of this.enemies) {
        if (e.dead || e.friendly) continue;
        const rr = e.r * 0.75 + pr;
        if ((p.x - e.x) ** 2 + (p.y - e.y) ** 2 > rr * rr) continue;
        if (bag) {
          if (!e.ramT || this.t > e.ramT) {
            e.ramT = this.t + 0.2;
            this.hitEnemy(e, 3);
            this.text(e.x, e.y - e.r, pick(['¡BARRAZO!', '¡PAN!', '¡CRUJ!']), { size: 22 });
          }
        } else {
          this.hurtPlayer();
          if (!e.boss) this.hitEnemy(e, 2);
        }
      }
      for (const k of this.pickups) {
        if (k.dead) continue;
        const rr = (k.kind === 'croquetita' ? 14 : 24) + p.r * 0.8;
        if ((p.x - k.x) ** 2 + (p.y - k.y) ** 2 < rr * rr) {
          k.dead = true;
          this.applyPickup(k.kind, k);
        }
      }
    }

    // limpiar enemigos fuera de pantalla
    for (const e of this.enemies) {
      if (e.dead) continue;
      const out = e.gone || e.y > H + 90 || e.x < -120 || e.x > W + 120;
      if (!out) continue;
      e.dead = true;
      if (e.friendly) {
        this.stats.pollitosSaved++;
        this.addScore(50);
        this.text(Math.max(110, Math.min(W - 110, e.x)), Math.max(120, Math.min(H - 60, e.y)), '¡Pollito a salvo! +50', { size: 18, color: INK, life: 1.2 });
      }
    }

    this.enemies = this.enemies.filter((e) => !e.dead);
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.ebullets = this.ebullets.filter((b) => !b.dead);
    this.pickups = this.pickups.filter((k) => !k.dead);

    for (const q of this.parts) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 1 - Math.min(1, dt * 2.5);
      q.vy *= 1 - Math.min(1, dt * 2.5);
      q.life -= dt;
    }
    this.parts = this.parts.filter((q) => q.life > 0);
    for (const tx of this.texts) {
      tx.y += tx.vy * dt;
      tx.life -= dt;
    }
    this.texts = this.texts.filter((tx) => tx.life > 0);

    this.shake = Math.max(0, this.shake - real * 40);
    if (this.lag > 0) this.lag -= dt;
    if (this.shout) {
      this.shout.time -= real;
      if (this.shout.time <= 0) this.shout = null;
    }

    if (p.dead) {
      this.deadT -= real;
      if (this.deadT <= 0) this.finish();
    }
  }

  finish() {
    const best = Number(localStorage.getItem('pewpew.best') || 0);
    const isBest = this.score > best;
    if (isBest) {
      try { localStorage.setItem('pewpew.best', String(this.score)); } catch { /* sin almacenamiento */ }
    }
    const result = {
      score: this.score, wave: this.wave, best: Math.max(best, this.score), isBest,
      char: this.char, mods: this.modList, ...this.stats,
    };
    this.stop();
    this.render();
    this.hooks.onGameOver?.(result);
  }

  // ───────────── DIBUJAR ─────────────
  makeDoodles() {
    this.doodles = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      this.doodles.push({
        kind: pick(DOODLE_KINDS),
        x: i % 3 === 0 ? rand(6, 30) : rand(60, this.W - 40),
        y0: rand(0, this.H + 300),
        rot: rand(-0.4, 0.4),
        s: rand(0.8, 1.3),
        seed: SEED++,
      });
    }
  }

  drawPaper(ctx) {
    const W = this.W;
    const H = this.H;
    ctx.fillStyle = '#fbfaf3';
    ctx.fillRect(0, 0, W, H);
    const off = (this.t * 38) % 28;
    ctx.strokeStyle = 'rgba(90,140,220,.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = off - 28; y < H; y += 28) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220,60,60,.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 0);
    ctx.lineTo(38, H);
    ctx.stroke();

    if (!this.doodles) return;
    const span = H + 300;
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (const d of this.doodles) {
      const y = ((d.y0 + this.t * 38) % span) - 150;
      ctx.save();
      ctx.translate(d.x, y);
      ctx.rotate(d.rot);
      ctx.scale(d.s, d.s);
      this.drawDoodle(d);
      ctx.restore();
    }
    ctx.restore();
  }

  drawDoodle(d) {
    const p = this.pen.begin(d.seed, PENCIL, 1.6);
    switch (d.kind) {
      case 'star': p.poly([0, -14, 4, -4, 14, -4, 6, 3, 9, 13, 0, 7, -9, 13, -6, 3, -14, -4, -4, -4]); break;
      case 'spiral': {
        const pts = [];
        for (let i = 0; i < 24; i++) { const a = i * 0.55; const r = i * 0.7; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
        p.curve(pts);
        break;
      }
      case 'heart': p.curve([0, 10, -12, -2, -8, -10, 0, -4, 8, -10, 12, -2, 0, 10]); break;
      case 'pew': p.text('pew pew', 0, 0, 20, PENCIL); break;
      case 'math': p.text('2+2=5', 0, 0, 18, PENCIL); break;
      case 'smile': p.circle(0, 0, 12); p.dot(-4, -3, 1.5); p.dot(4, -3, 1.5); p.curve([-6, 4, 0, 8, 6, 4]); break;
      case 'cube': p.poly([-8, -4, 4, -4, 4, 8, -8, 8]); p.poly([-4, -9, 9, -9, 9, 3, 4, 8, 4, -4, -8, -4], null, false); break;
      case 'arrow': p.line(-14, 0, 12, 0); p.poly([5, -6, 13, 0, 5, 6], null, false); break;
      case 'flower': for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; p.circle(Math.cos(a) * 7, Math.sin(a) * 7, 5); } p.circle(0, 0, 3); break;
      case 'exam': p.text('EXAMEN JUEVES!!', 0, 0, 16, PENCIL); break;
      case 'ufo': p.ellipse(0, 0, 14, 5); p.ellipse(0, -5, 6, 5); break;
    }
  }

  drawEntity(e, sprite, color, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.flash > 0 && e.boss) ctx.translate(rand(-2, 2), rand(-2, 2));
    if (e.rot) ctx.rotate(e.rot);
    ctx.globalAlpha = e.flash > 0 && !e.boss ? 0.45 : alpha;
    this.pen.begin(e.seed + Math.floor(this.t * 8) * 97, color, e.boss ? 2.8 : 2.4);
    SPRITES[sprite](this.pen, e.r, this.t, e);
    if (e.hat) {
      if (e.rot) ctx.rotate(-e.rot);
      drawHat(this.pen, e.r);
    }
    ctx.restore();
  }

  // posición en pantalla (para textos que no deben salir boca abajo)
  sy(y) {
    return this.flip ? this.H - y : y;
  }

  render() {
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawPaper(ctx);
    if (!this.player) return;
    const p = this.player;
    const boil = Math.floor(this.t * 8) * 97;

    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-1, 1) * this.shake * 0.5, rand(-1, 1) * this.shake * 0.5);
    if (this.flip) {
      ctx.translate(0, H);
      ctx.scale(1, -1);
    }

    for (const k of this.pickups) {
      ctx.save();
      ctx.translate(k.x, k.y);
      if (this.flip) ctx.scale(1, -1);
      this.pen.begin(k.seed + boil, INK, 2.2);
      drawPickup(this.pen, k.kind);
      ctx.restore();
    }

    for (const e of this.enemies) {
      const color = e.boss ? BLACK : e.friendly ? INK : RED;
      this.drawEntity(e, e.type, color);
    }

    for (const b of this.ebullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.rot) ctx.rotate(b.rot);
      this.pen.begin(b.seed + boil, RED, 2);
      drawProjectile(this.pen, b);
      ctx.restore();
    }

    for (const b of this.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.rot) ctx.rotate(b.rot);
      this.pen.begin(b.seed + boil, b.kind === 'laser' ? '#ff2d55' : INK, 2);
      drawProjectile(this.pen, b);
      ctx.restore();
    }

    if (!p.dead) {
      const blink = p.inv > 0 && Math.floor(this.t * 14) % 2 === 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.globalAlpha = blink ? 0.3 : 1;
      this.pen.begin(p.seed + boil, INK, 2.4);
      const bag = p.pu?.id === 'baguette';
      drawFlame(this.pen, bag ? p.r * 1.05 : p.r, this.t);
      SPRITES[bag ? 'baguette' : this.char.sprite](this.pen, p.r, this.t, p);
      if (this.lag > 0) {
        ctx.rotate(-p.tilt);
        this.pen.text('⟳', 0, -p.r * 1.6, 22, PENCIL);
      }
      ctx.restore();
    }

    ctx.lineCap = 'round';
    for (const q of this.parts) {
      const a = Math.max(0, q.life / q.max);
      const sp = Math.hypot(q.vx, q.vy) || 1;
      ctx.globalAlpha = a;
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - (q.vx / sp) * q.len, q.y - (q.vy / sp) * q.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // textos y bocadillos siempre del derecho
    for (const tx of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (tx.life / tx.max) * 2);
      ctx.translate(tx.x, this.sy(tx.y));
      ctx.rotate(tx.rot);
      this.pen.text(tx.str, 0, 0, tx.size, tx.color);
      ctx.restore();
    }
    for (const e of this.enemies) {
      if (!e.bubble) continue;
      const ey = this.sy(e.y);
      this.pen.begin(e.seed, e.boss ? BLACK : e.friendly ? INK : RED, 2);
      if (e.boss) {
        // los jefes hablan por debajo para no tapar la barra de vida
        drawBubble(this.pen, e.x, this.flip ? ey - e.r - 50 : ey + e.r * 0.95, e.bubble.text, 19, { W, up: !this.flip });
      } else {
        const by = this.flip ? ey - e.r * 0.9 : ey - e.r * 1.05;
        drawBubble(this.pen, e.x, Math.max(40 + this.safeTop, by), e.bubble.text, 16, { W });
      }
    }

    this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    const W = this.W;
    const H = this.H;
    const p = this.player;
    const top = this.safeTop + 8;
    const pen = this.pen.begin(7 + Math.floor(this.t * 4) * 13, INK, 2.2);

    pen.text(String(this.score), 14, top + 18, 30, INK, 'left');
    pen.text(`oleada ${this.wave}`, 14, top + 44, 16, PENCIL, 'left');

    const n = Math.max(0, p.lives);
    for (let i = 0; i < n; i++) {
      const x = W / 2 - (n - 1) * 13 + i * 26;
      ctx.save();
      ctx.translate(x, top + 18);
      pen.curve([0, 8, -9, -1, -6, -8, 0, -3, 6, -8, 9, -1, 0, 8]);
      ctx.fillStyle = HL.red;
      ctx.beginPath();
      ctx.arc(-3, -3, 4, 0, Math.PI * 2);
      ctx.arc(3, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let y = top + 58;
    if (p.pu && p.pu.max > 0) {
      const names = { calcetines: 'calcetines', gravedad: 'gravedad x2', comicsans: 'comic sans', baguette: 'baguette' };
      pen.text(names[p.pu.id] || p.pu.id, W / 2, y, 16, INK);
      const bw = 110;
      const f = Math.max(0, p.pu.time / p.pu.max);
      pen.poly([W / 2 - bw / 2, y + 12, W / 2 + bw / 2, y + 12, W / 2 + bw / 2, y + 20, W / 2 - bw / 2, y + 20]);
      ctx.fillStyle = HL.yellow;
      ctx.fillRect(W / 2 - bw / 2 + 2, y + 14, (bw - 4) * f, 5);
      y += 32;
    }

    const boss = this.enemies.find((e) => e.boss);
    if (boss) {
      pen.begin(3 + Math.floor(this.t * 4) * 13, BLACK, 2.2);
      pen.text(boss.name, W / 2, y + 4, 18, BLACK);
      const bw = W - 90;
      const f = Math.max(0, boss.hp / boss.maxHp);
      pen.poly([45, y + 16, 45 + bw, y + 16, 45 + bw, y + 27, 45, y + 27]);
      ctx.fillStyle = HL.red;
      ctx.fillRect(47, y + 18, (bw - 4) * f, 7);
    }

    if (this.modList?.length) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      pen.text(this.modList.map((m) => m.name).join(' · '), W / 2, H - 14, 14, PENCIL);
      ctx.restore();
    }

    if (this.banner) {
      const b = this.banner;
      const a = Math.min(1, b.time * 3, (b.max - b.time) * 4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      const big = b.title.startsWith('¡JEFE') ? 34 : 44;
      ctx.fillStyle = HL.yellow;
      ctx.font = `${big}px ${FONT}`;
      const tw = Math.min(W - 20, ctx.measureText(b.title).width + 20);
      ctx.fillRect(W / 2 - tw / 2, H * 0.4 - big * 0.25, tw, big * 0.55);
      pen.begin(11, INK);
      pen.text(b.title, W / 2, H * 0.4, big, b.title.startsWith('¡JEFE') ? RED : INK);
      pen.text(b.sub, W / 2, H * 0.4 + big * 0.9, 20, PENCIL);
      ctx.restore();
    }

    if (this.shout) {
      const s = this.shout;
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.time * 2);
      ctx.translate(W / 2, H * 0.55);
      ctx.rotate(-0.05);
      const size = Math.min(28, (W - 20) / (s.text.length * 0.5));
      pen.begin(19, RED);
      pen.text(s.text, 0, 0, size, RED);
      ctx.restore();
    }

    if (this.lag > 0) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      pen.begin(23 + Math.floor(this.t * 6), BLACK);
      pen.text('PERDIENDO CONEXIÓN' + '.'.repeat(1 + (Math.floor(this.t * 3) % 3)), W / 2, H * 0.62, 22, BLACK);
      ctx.restore();
    }
  }
}
