import { audio } from './audio/engine.js';
import { Recorder } from './audio/recorder.js';
import { loadAll, saveSound } from './audio/store.js';
import { SOUNDS, SOUND_BY_ID, FILTERS, MAX_TAKES, MAX_SECONDS } from './sounds.js';
import { Game } from './game/game.js';
import { Pen, INK, RED, PENCIL } from './game/doodle.js';
import { SPRITES, drawFlame } from './game/sprites.js';
import { CHARACTERS, rollMods } from './game/content.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ───────────── ESTADO ─────────────
let bank = {}; // id -> { id, takes: [{ sampleRate, data }], filter }
let synced = false;
let chosen = CHARACTERS[0];
let mods = rollMods();
let studioReturn = 's-title';
let current = 's-title';

const recorder = new Recorder(audio);
const game = new Game($('#game'), audio, {
  onGameOver: showGameOver,
  onPauseRequest: openPause,
});

function syncBanks() {
  if (!audio.ctx) return;
  for (const [id, rec] of Object.entries(bank)) audio.setBank(id, rec.takes, rec.filter);
  synced = true;
}

function ensureAudio() {
  audio.ensure();
  if (!synced) syncBanks();
}

document.addEventListener('pointerdown', ensureAudio, { capture: true });
document.addEventListener('keydown', ensureAudio, { capture: true });

loadAll().then((b) => {
  bank = b;
  synced = false;
  if (audio.ctx) syncBanks();
});

const recordedCount = () => Object.values(bank).filter((r) => r.takes?.length).length;
const missingRequired = () => SOUNDS.filter((s) => s.required && !bank[s.id]?.takes?.length);

// ───────────── TOAST ─────────────
let toastT = 0;
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), ms);
}

// ───────────── MINI-DIBUJOS ANIMADOS (portada, fichas…) ─────────────
let previews = [];
let prevRaf = 0;
function tickPreviews(ts) {
  const t = ts / 1000;
  for (const fn of previews) fn(t);
  prevRaf = requestAnimationFrame(tickPreviews);
}
function setPreviews(list) {
  previews = list;
  cancelAnimationFrame(prevRaf);
  if (list.length) prevRaf = requestAnimationFrame(tickPreviews);
}

function makePreview(canvas, draw) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = canvas.clientWidth || 120;
  const h = canvas.clientHeight || 120;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  const pen = new Pen(ctx);
  return (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, pen, t, w, h);
  };
}

function drawCharAt(ctx, pen, ch, x, y, r, t, seed, { dead = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (dead) {
    ctx.rotate(Math.PI + Math.sin(t * 2) * 0.1);
    ctx.globalAlpha = 0.85;
  }
  pen.begin(seed + Math.floor(t * 8) * 97, INK, 2.4);
  if (!dead) drawFlame(pen, r, t);
  SPRITES[ch.sprite](pen, r, t, {});
  ctx.restore();
  if (dead) {
    pen.begin(seed + 5, RED, 2.6);
    pen.line(x - r * 0.9, y - r * 1.4, x + r * 0.9, y - r * 1.4 + 2);
    pen.text('x_x', x, y - r * 1.7, 18, RED);
  }
}

function titlePreview() {
  const cast = [
    ['michi', INK], ['pato', RED], ['vaca', INK], ['brocoli', RED], ['pinguino', INK],
  ];
  return makePreview($('#title-cast'), (ctx, pen, t, w, h) => {
    const r = Math.min(24, w / 13);
    cast.forEach(([sp, col], i) => {
      const x = (w / cast.length) * (i + 0.5);
      const y = h / 2 + Math.sin(t * 2.2 + i * 1.3) * 10;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.7 + i) * 0.12);
      pen.begin(i * 31 + Math.floor(t * 8) * 97, col, 2.3);
      if (col === INK) drawFlame(pen, r, t);
      SPRITES[sp](pen, r, t, {});
      ctx.restore();
    });
  });
}

// ───────────── NAVEGACIÓN ─────────────
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  current = id;
  $('#btn-pause').hidden = id !== null;
  if (id !== 's-studio') {
    if (recState) abortRec();
    recorder.close();
  }
  const anim = [];
  if (id === 's-title') {
    const b = Number(localStorage.getItem('pewpew.best') || 0);
    $('#best').textContent = b > 0 ? `Récord: ${b} puntos` : '';
    anim.push(titlePreview());
  }
  if (id === 's-select') anim.push(...renderSelect());
  if (id === 's-rules') anim.push(renderRules());
  if (id === 's-over' && overPreview) anim.push(overPreview);
  setPreviews(anim);
  const el = id && document.getElementById(id);
  if (el) el.scrollTop = 0;
}

document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));

$('#b-play').addEventListener('click', () => {
  ensureAudio();
  if (recordedCount() === 0) openStudio('s-title', true);
  else show('s-select');
});
$('#b-studio').addEventListener('click', () => openStudio('s-title'));
$('#b-how').addEventListener('click', () => show('s-how'));

// ───────────── ESTUDIO DE GRABACIÓN ─────────────
const list = $('#sound-list');
let recState = null;
let firstTime = false;

async function openStudio(from, first = false) {
  ensureAudio();
  studioReturn = from;
  firstTime = first;
  $('#studio-intro').innerHTML = first
    ? '<b>Antes de jugar, presta tu voz.</b> Aquí no hay efectos de sonido: los pones tú. Mantén pulsado el botón rojo mientras haces el ruido y suelta.'
    : 'Mantén pulsado el botón rojo mientras haces el ruido. Suelta y escucha. Los 4 primeros son los importantes.';
  show('s-studio');
  renderStudio();
  await openMic();
}

async function openMic() {
  const st = $('#mic-status');
  st.className = 'mic';
  st.textContent = 'Pidiendo permiso para el micrófono…';
  try {
    await recorder.open();
    st.textContent = 'Micrófono listo.';
    return true;
  } catch (e) {
    st.className = 'mic bad';
    if (e?.message === 'unsupported' || !window.isSecureContext) {
      st.textContent = 'Este navegador no puede grabar audio aquí. Puedes jugar igual, con pitidos tristes de emergencia.';
    } else if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
      st.textContent = 'Sin permiso de micrófono. Actívalo en los ajustes del navegador para grabar (mientras, pitidos de emergencia).';
    } else if (e?.name === 'NotFoundError') {
      st.textContent = 'No encuentro ningún micrófono.';
    } else {
      st.textContent = 'No se pudo abrir el micrófono.';
    }
    return false;
  }
}

function cardHTML(s) {
  const rec = bank[s.id];
  const takes = rec?.takes || [];
  const filter = rec?.filter || 'normal';
  const full = takes.length >= MAX_TAKES;
  const takesHTML = takes.length
    ? takes
        .map(
          (_, i) => `<span class="take">
            <button data-action="play" data-i="${i}" aria-label="Escuchar toma ${i + 1}"><canvas data-wave="${i}"></canvas>${i + 1}</button>
            <button class="del" data-action="del" data-i="${i}" aria-label="Borrar toma ${i + 1}">✕</button>
          </span>`,
        )
        .join('')
    : '<span class="empty">sin grabar</span>';
  return `<article class="card ${takes.length ? 'done' : ''}" data-id="${s.id}">
    <header>
      <h4>${esc(s.name)}</h4>
      <span class="badge ${s.required ? 'req' : 'opt'}">${s.required ? 'principal' : 'opcional'}</span>
    </header>
    <p class="hint">${esc(s.hint)}${s.required ? '' : ' <i>Si no lo grabas, me lo invento con tus otros sonidos.</i>'}</p>
    <div class="row">
      <button class="rec" data-action="rec" ${full ? 'disabled' : ''}>
        <span class="time"></span>
        <span class="lbl">${full ? `${MAX_TAKES}/${MAX_TAKES} tomas` : takes.length ? '● Otra toma' : '● Mantén para grabar'}</span>
        <span class="lvl"></span>
      </button>
      <div class="takes">${takesHTML}</div>
    </div>
    <div class="filters">
      <span>Filtro:</span>
      ${FILTERS.map((f) => `<button class="chip ${f.id === filter ? 'on' : ''}" data-action="filter" data-f="${f.id}">${f.name}</button>`).join('')}
      ${takes.length ? '<button class="test" data-action="test">probar</button>' : ''}
    </div>
  </article>`;
}

function drawWaves(card, id) {
  const takes = bank[id]?.takes || [];
  card.querySelectorAll('canvas[data-wave]').forEach((cv) => {
    const tk = takes[Number(cv.dataset.wave)];
    if (!tk) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 54;
    const h = 22;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const d = tk.data;
    const step = Math.max(1, Math.floor(d.length / w));
    for (let x = 0; x < w; x++) {
      let mx = 0;
      for (let i = x * step; i < Math.min(d.length, (x + 1) * step); i++) mx = Math.max(mx, Math.abs(d[i]));
      const a = Math.max(0.5, mx * (h / 2 - 1));
      ctx.moveTo(x + 0.5, h / 2 - a);
      ctx.lineTo(x + 0.5, h / 2 + a);
    }
    ctx.stroke();
  });
}

function renderStudio() {
  list.innerHTML = SOUNDS.map(cardHTML).join('');
  for (const s of SOUNDS) drawWaves(list.querySelector(`[data-id="${s.id}"]`), s.id);
  updateWarn();
}

function rerenderCard(id) {
  const old = list.querySelector(`[data-id="${id}"]`);
  if (!old) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = cardHTML(SOUND_BY_ID[id]);
  const card = tmp.firstElementChild;
  old.replaceWith(card);
  drawWaves(card, id);
  updateWarn();
}

function updateWarn() {
  const miss = missingRequired();
  $('#studio-warn').textContent = miss.length
    ? `Faltan ${miss.length === 1 ? '1 sonido principal' : `${miss.length} sonidos principales`}: sonarán pitidos tristes de emergencia.`
    : '';
}

// actualiza el audio al momento y guarda en segundo plano
function persist(id) {
  const rec = bank[id];
  if (!rec) return Promise.resolve();
  audio.setBank(id, rec.takes, rec.filter);
  return saveSound(rec);
}

list.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn || btn.dataset.action === 'rec') return;
  const card = btn.closest('.card');
  const id = card.dataset.id;
  const rec = bank[id];
  ensureAudio();
  switch (btn.dataset.action) {
    case 'play':
      audio.play(id, { take: Number(btn.dataset.i), vary: false });
      break;
    case 'test':
      audio.play(id);
      break;
    case 'del':
      if (!rec) return;
      rec.takes.splice(Number(btn.dataset.i), 1);
      rerenderCard(id);
      persist(id);
      break;
    case 'filter': {
      const r = (bank[id] ||= { id, takes: [], filter: 'normal' });
      r.filter = btn.dataset.f;
      rerenderCard(id);
      persist(id);
      if (r.takes.length) audio.play(id);
      break;
    }
  }
});

list.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.rec')) e.preventDefault();
});

list.addEventListener('pointerdown', (ev) => {
  const btn = ev.target.closest('[data-action="rec"]');
  if (!btn || btn.disabled) return;
  ev.preventDefault();
  try { btn.setPointerCapture(ev.pointerId); } catch { /* da igual */ }
  startRec(btn.closest('.card').dataset.id, btn);
});

const release = () => recState && stopRec();
list.addEventListener('pointerup', release);
list.addEventListener('pointercancel', release);

// teclado: espacio/enter sobre el botón también graba
list.addEventListener('keydown', (ev) => {
  const btn = ev.target.closest?.('[data-action="rec"]');
  if (!btn || ev.repeat || (ev.key !== ' ' && ev.key !== 'Enter')) return;
  ev.preventDefault();
  startRec(btn.closest('.card').dataset.id, btn);
});
list.addEventListener('keyup', (ev) => {
  if (ev.key === ' ' || ev.key === 'Enter') release();
});

async function startRec(id, btn) {
  if (recState) return;
  ensureAudio();
  if (!recorder.ready) {
    const ok = await openMic();
    if (ok) toast('Micrófono listo. Ahora sí: mantén pulsado y haz el ruido.');
    return;
  }
  try {
    recorder.start();
  } catch (e) {
    console.warn(e);
    toast('No se pudo empezar a grabar.');
    return;
  }
  recState = { id, btn, stopping: false, raf: 0 };
  btn.classList.add('on');
  btn.querySelector('.lbl').textContent = 'Grabando… suelta';
  const timeEl = btn.querySelector('.time');
  const lvlEl = btn.querySelector('.lvl');
  const tick = () => {
    if (!recState || recState.btn !== btn || recState.stopping) return;
    const el = recorder.elapsed;
    timeEl.style.width = Math.min(100, (el / MAX_SECONDS) * 100) + '%';
    lvlEl.style.width = recorder.level() * 100 + '%';
    if (el >= MAX_SECONDS) return stopRec();
    recState.raf = requestAnimationFrame(tick);
  };
  tick();
}

function abortRec() {
  if (!recState) return;
  cancelAnimationFrame(recState.raf);
  recorder.cancel();
  recState = null;
}

async function stopRec() {
  if (!recState || recState.stopping) return;
  recState.stopping = true;
  const { id, btn } = recState;
  cancelAnimationFrame(recState.raf);
  if (recorder.elapsed < 0.2) {
    recorder.cancel();
    recState = null;
    rerenderCard(id);
    toast('Mantén pulsado el botón mientras haces el ruido.');
    return;
  }
  btn.classList.remove('on');
  btn.querySelector('.lbl').textContent = 'Procesando…';
  const res = await recorder.stop();
  recState = null;
  if (!res || res.error) {
    toast('Algo falló al grabar. Prueba otra vez.');
    rerenderCard(id);
    return;
  }
  if (res.silent) {
    toast('No se oyó nada. ¿Tienes el micro silenciado?');
    rerenderCard(id);
    return;
  }
  const rec = (bank[id] ||= { id, takes: [], filter: 'normal' });
  rec.takes.push(res);
  rerenderCard(id);
  persist(id);
  audio.play(id, { take: rec.takes.length - 1, vary: false });
}

$('#b-studio-done').addEventListener('click', () => {
  if (recState) return;
  if (recordedCount() === 0 && !confirm('No has grabado nada. ¿Jugar con pitidos tristes de emergencia?')) return;
  show('s-select');
});
$('#b-studio-back').addEventListener('click', () => show(studioReturn));

// ───────────── PERSONAJES ─────────────
function renderSelect() {
  const grid = $('#char-grid');
  grid.innerHTML = CHARACTERS.map(
    (c) => `<button class="char" data-char="${c.id}">
      <canvas></canvas>
      <b>${esc(c.name)}</b>
      <span class="st">${esc(c.stat)}</span>
      <p>${esc(c.desc)}</p>
    </button>`,
  ).join('');
  return CHARACTERS.map((c, i) =>
    makePreview(grid.children[i].querySelector('canvas'), (ctx, pen, t, w, h) => {
      drawCharAt(ctx, pen, c, w / 2, h / 2 - 6 + Math.sin(t * 2.5 + i) * 5, Math.min(w, h) * 0.3, t, i * 17);
    }),
  );
}

$('#char-grid').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-char]');
  if (!b) return;
  chosen = CHARACTERS.find((c) => c.id === b.dataset.char);
  mods = rollMods();
  show('s-rules');
});
$('#b-select-back').addEventListener('click', () => show('s-title'));

// ───────────── REGLAS DE LA PARTIDA ─────────────
function renderRules() {
  $('#rules-who').innerHTML = `Juegas con <b>${esc(chosen.name)}</b>`;
  $('#rules-list').innerHTML = mods.map((m) => `<li><b>${esc(m.name)}</b><span>${esc(m.desc)}</span></li>`).join('');
  return makePreview($('#rules-char'), (ctx, pen, t, w, h) => {
    drawCharAt(ctx, pen, chosen, w / 2, h / 2 - 8 + Math.sin(t * 2.5) * 5, Math.min(w, h) * 0.28, t, 3);
  });
}

$('#b-reroll').addEventListener('click', () => {
  mods = rollMods();
  show('s-rules');
});
$('#b-rules-back').addEventListener('click', () => show('s-select'));
$('#b-launch').addEventListener('click', startGame);

function startGame() {
  ensureAudio();
  show(null);
  game.resize();
  game.start(chosen.id, mods);
}

// ───────────── PAUSA ─────────────
function openPause() {
  if (!game.running) return;
  game.pause();
  show('s-pause');
  $('#btn-pause').hidden = true;
}

$('#btn-pause').addEventListener('click', openPause);
$('#b-resume').addEventListener('click', () => {
  show(null);
  ensureAudio();
  game.resume();
});
$('#b-mute').addEventListener('click', (e) => {
  audio.muted = !audio.muted;
  e.currentTarget.textContent = audio.muted ? 'Activar sonido' : 'Silenciar';
});
$('#b-quit').addEventListener('click', () => {
  game.stop();
  show('s-title');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.running && !game.paused) openPause();
    if (recState) abortRec();
    if (current === 's-studio') recorder.close();
    audio.suspend();
  } else if (current === 's-studio' && !recorder.ready) {
    openMic();
  }
});

// ───────────── FIN DE PARTIDA ─────────────
let overPreview = null;
function showGameOver(r) {
  $('#over-epitaph').textContent =
    `Aquí yace ${r.char.name}. ${r.char.epitaph}` + (r.pollitosKilled ? ' Los pollitos no le echarán de menos.' : '');
  $('#over-score').innerHTML = `${r.score} puntos<small>${r.isBest ? '¡NUEVO RÉCORD!' : `Récord: ${r.best}`}</small>`;
  const rows = [
    ['Oleada', r.wave],
    ['Enemigos derrotados', r.kills],
    ['Jefes derrotados', r.bosses],
    ['Pollitos rescatados', r.pollitosSaved],
    ['Pollitos asesinados', r.pollitosKilled],
    ['Power-ups', r.powerups],
    ['Reglas', r.mods.map((m) => m.name).join(', ')],
  ];
  $('#over-stats').innerHTML = rows.map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('');
  overPreview = null;
  show('s-over');
  overPreview = makePreview($('#over-char'), (ctx, pen, t, w, h) => {
    drawCharAt(ctx, pen, r.char, w / 2, h / 2 + 10, Math.min(w, h) * 0.26, t, 9, { dead: true });
  });
  setPreviews([overPreview]);
}

$('#b-again').addEventListener('click', () => {
  mods = rollMods();
  show('s-rules');
});
$('#b-change').addEventListener('click', () => show('s-select'));
$('#b-rerecord').addEventListener('click', () => openStudio('s-over'));
$('#b-menu').addEventListener('click', () => show('s-title'));

// ───────────── ARRANQUE ─────────────
show('s-title');
// gancho de depuración: window.__pewpew.game desde la consola
window.__pewpew = { game, audio };
document.fonts?.load('20px "Patrick Hand"').then(() => game.resize()).catch(() => {});
