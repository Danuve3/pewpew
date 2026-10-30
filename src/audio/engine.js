// Reproduce las grabaciones con filtros de voz y algo de variación
// aleatoria en cada disparo para que no canse tanto.
import { SOUND_BY_ID } from '../sounds.js';

const RANDOM_FILTERS = ['normal', 'ardilla', 'gigante', 'robot', 'eco', 'reves'];

// Pitidos tristes de emergencia para cuando no hay grabación.
function synth(id, sr) {
  const specs = {
    shoot: [0.12, (f) => 950 - 650 * f, 'sq'],
    enemyShoot: [0.16, (f) => 260 + 180 * f, 'saw'],
    enemyDie: [0.25, null, 'noise'],
    playerDie: [0.9, (f) => 420 - 340 * f, 'sq'],
    hurt: [0.2, (f) => 620 - 320 * f, 'sq'],
    powerup: [0.3, (f) => 400 + 900 * f, 'sq'],
    bossAppear: [0.8, (f) => 110 + 40 * Math.sin(f * 30), 'saw'],
    bossDie: [1, null, 'noise'],
  };
  const [dur, freq, kind] = specs[id] || specs.shoot;
  const n = Math.floor(dur * sr);
  const data = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const env = Math.pow(1 - f, 1.5) * Math.min(1, i / (sr * 0.005));
    let v;
    if (kind === 'noise') v = Math.random() * 2 - 1;
    else {
      ph += freq(f) / sr;
      const x = ph % 1;
      v = kind === 'sq' ? (x < 0.5 ? 1 : -1) : x * 2 - 1;
    }
    data[i] = v * env * 0.35;
  }
  return { sampleRate: sr, data };
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.banks = {};
    this.synths = {};
    this.active = {};
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.ratio.value = 6;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.95;
      this.master.connect(this.comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  toBuffer({ sampleRate, data }) {
    const b = this.ctx.createBuffer(1, data.length, sampleRate);
    b.copyToChannel(data, 0);
    return b;
  }

  setBank(id, takes, filter = 'normal') {
    if (!this.ctx) this.ensure();
    this.banks[id] = {
      filter,
      takes: (takes || []).filter((tk) => tk?.data?.length).map((tk) => ({ raw: tk, buf: this.toBuffer(tk), rev: null })),
    };
  }

  setFilter(id, filter) {
    if (this.banks[id]) this.banks[id].filter = filter;
  }

  reversed(take) {
    if (!take.rev) {
      const d = take.raw.data.slice().reverse();
      take.rev = this.toBuffer({ sampleRate: take.raw.sampleRate, data: d });
    }
    return take.rev;
  }

  resolve(id) {
    const own = this.banks[id];
    if (own?.takes.length) return { bank: own, filter: own.filter };
    const fb = SOUND_BY_ID[id]?.fallback;
    if (fb && this.banks[fb.from]?.takes.length) return { bank: this.banks[fb.from], filter: fb.filter };
    if (!this.synths[id]) {
      const raw = synth(id, this.ctx.sampleRate);
      this.synths[id] = { filter: 'normal', takes: [{ raw, buf: this.toBuffer(raw), rev: null }] };
    }
    return { bank: this.synths[id], filter: 'normal' };
  }

  hasRecording(id) {
    return !!this.banks[id]?.takes.length;
  }

  // opts: { filter, take, volume, vary }
  play(id, opts = {}) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const def = SOUND_BY_ID[id];
    const { bank, filter: f0 } = this.resolve(id);
    if (!bank.takes.length) return;
    let filter = opts.filter || f0;
    if (filter === 'caos') filter = RANDOM_FILTERS[Math.floor(Math.random() * RANDOM_FILTERS.length)];
    const take = opts.take !== undefined ? bank.takes[opts.take] : bank.takes[Math.floor(Math.random() * bank.takes.length)];
    if (!take) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = filter === 'reves' ? this.reversed(take) : take.buf;
    let rate = 1;
    if (filter === 'ardilla') rate = 1.75;
    if (filter === 'gigante') rate = 0.6;
    if (opts.vary !== false) rate *= 0.9 + Math.random() * 0.22;
    src.playbackRate.value = rate;
    const dur = src.buffer.duration / rate;

    const out = ctx.createGain();
    out.gain.value = (def?.vol ?? 0.8) * (opts.volume ?? 1);
    const extra = [];

    let node = src;
    if (filter === 'robot') {
      const ring = ctx.createGain();
      ring.gain.value = 0;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      osc.connect(ring.gain);
      osc.start(now);
      osc.stop(now + dur + 0.05);
      src.connect(ring);
      node = ring;
      out.gain.value *= 1.6;
      extra.push(osc, ring);
    }
    node.connect(out);
    out.connect(this.master);

    if (filter === 'eco') {
      const d = ctx.createDelay(1);
      d.delayTime.value = 0.17;
      const fb = ctx.createGain();
      fb.gain.value = 0.45;
      const wet = ctx.createGain();
      wet.gain.value = 0.7;
      out.connect(d);
      d.connect(fb).connect(d);
      d.connect(wet).connect(this.master);
      // el bucle de eco se suelta cuando ya se ha apagado
      setTimeout(() => {
        try { d.disconnect(); fb.disconnect(); wet.disconnect(); } catch { /* ya estaba */ }
      }, (dur + 1.8) * 1000);
    }

    src.start(now);
    const list = (this.active[id] ||= []);
    list.push(src);
    src.onended = () => {
      const i = list.indexOf(src);
      if (i >= 0) list.splice(i, 1);
      try { out.disconnect(); for (const n of extra) n.disconnect(); } catch { /* nada */ }
    };
    const max = def?.voices ?? 4;
    while (list.length > max) {
      const old = list.shift();
      try { old.stop(); } catch { /* ya parado */ }
    }
  }
}

export const audio = new AudioEngine();
