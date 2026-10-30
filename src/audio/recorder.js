// Graba con MediaRecorder, decodifica y limpia la toma: recorta el
// silencio del principio y del final, la normaliza y le pone fundidos.
import { MAX_SECONDS } from '../sounds.js';

const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/aac'];

export class Recorder {
  constructor(audio) {
    this.audio = audio;
    this.stream = null;
    this.mr = null;
    this.analyser = null;
    this.buf = null;
  }

  get ready() {
    return !!this.stream && this.stream.getAudioTracks().some((t) => t.readyState === 'live');
  }

  async open() {
    if (this.ready) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('unsupported');
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const ctx = this.audio.ensure();
    const srcNode = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buf = new Float32Array(this.analyser.fftSize);
    srcNode.connect(this.analyser);
    this.srcNode = srcNode;
  }

  close() {
    try { this.srcNode?.disconnect(); } catch { /* nada */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.analyser = null;
  }

  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.buf);
    let s = 0;
    for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i];
    return Math.min(1, Math.sqrt(s / this.buf.length) * 4);
  }

  start() {
    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported?.(m));
    this.chunks = [];
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.mr.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.mr.start();
    this.startedAt = performance.now();
  }

  get elapsed() {
    return this.mr ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  cancel() {
    if (this.mr && this.mr.state !== 'inactive') {
      this.mr.onstop = null;
      this.mr.stop();
    }
    this.mr = null;
  }

  stop() {
    const mr = this.mr;
    this.mr = null;
    if (!mr) return Promise.resolve(null);
    return new Promise((resolve) => {
      mr.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: mr.mimeType || 'audio/webm' });
          const ab = await blob.arrayBuffer();
          const ctx = this.audio.ensure();
          const decoded = await new Promise((ok, ko) => {
            const p = ctx.decodeAudioData(ab, ok, ko);
            if (p?.then) p.then(ok, ko);
          });
          resolve(clean(decoded));
        } catch (e) {
          console.warn('No se pudo procesar la grabación', e);
          resolve({ error: true });
        }
      };
      // un pelín de margen para no cortar el final de la palabra
      setTimeout(() => mr.state !== 'inactive' && mr.stop(), 120);
    });
  }
}

function clean(audioBuffer) {
  const sr = audioBuffer.sampleRate;
  const src = audioBuffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < src.length; i++) peak = Math.max(peak, Math.abs(src[i]));
  if (peak < 0.01) return { silent: true };

  const thr = Math.max(0.015, peak * 0.08);
  let a = 0;
  while (a < src.length && Math.abs(src[a]) < thr) a++;
  let b = src.length - 1;
  while (b > a && Math.abs(src[b]) < thr) b--;
  a = Math.max(0, a - Math.floor(sr * 0.03));
  b = Math.min(src.length, b + Math.floor(sr * 0.08));
  b = Math.min(b, a + Math.floor(sr * MAX_SECONDS));

  const data = src.slice(a, b);
  const gain = Math.min(8, 0.92 / peak);
  const fin = Math.min(data.length, Math.floor(sr * 0.004));
  const fout = Math.min(data.length, Math.floor(sr * 0.02));
  for (let i = 0; i < data.length; i++) {
    let g = gain;
    if (i < fin) g *= i / fin;
    if (i > data.length - fout) g *= (data.length - i) / fout;
    data[i] *= g;
  }
  return { sampleRate: sr, data };
}
