// Âm thanh cờ vua — WebAudio synth: không file, không network, an toàn CSP.
// AudioContext lazy: tạo ở lần phát đầu sau cử chỉ người dùng (autoplay policy);
// không có context thì im lặng bỏ qua.
const KEY = 'kidgpt-games:chess:sound';

let ctx = null;

function ac() {
  const AC = (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext)) || null;
  if (!AC) { ctx = null; return null; }
  if (!ctx) {
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
  }
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    try { ctx.resume().catch(() => {}); } catch (e) { /* bỏ qua */ }
  }
  return ctx;
}

function beep(c, freq, start, dur, type, vol) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const SFX = {
  move: (c) => beep(c, 220, 0, 0.07, 'triangle', 0.15),
  capture: (c) => { beep(c, 330, 0, 0.09, 'square', 0.07); beep(c, 180, 0.07, 0.11, 'square', 0.07); },
  check: (c) => { beep(c, 660, 0, 0.08, 'sine', 0.1); beep(c, 660, 0.12, 0.08, 'sine', 0.1); },
  win: (c) => { [523, 659, 784].forEach((f, i) => beep(c, f, i * 0.12, 0.16, 'sine', 0.12)); },
  lose: (c) => beep(c, 196, 0, 0.4, 'sine', 0.1),
  hint: (c) => { beep(c, 880, 0, 0.07, 'sine', 0.1); beep(c, 1175, 0.08, 0.1, 'sine', 0.1); },
};

export function playSfx(name) {
  if (!isSoundOn()) return;
  const fn = SFX[name];
  if (!fn) return;
  const c = ac();
  if (!c) return;
  try { fn(c); } catch (e) { /* trình duyệt chặn âm — bỏ qua */ }
}

export function isSoundOn() {
  try {
    const v = (typeof localStorage !== 'undefined') && localStorage.getItem(KEY);
    return v !== 'off';
  } catch (e) {
    return true;
  }
}

export function setSoundOn(on) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch (e) { /* private mode */ }
}
