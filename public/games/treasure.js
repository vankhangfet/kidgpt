import { esc } from '../util.js';

export const TREASURE_LEVELS = [
  { id: 1, ops: ['add', 'sub'] },
  { id: 2, ops: ['add', 'sub'] },
  { id: 3, ops: ['add', 'sub', 'mul', 'div'] },
];
export const NODE_EMOJIS = ['🏝️', '🌴', '🔐', '🏴‍☠️', '💎'];
export const QUESTIONS_PER_NODE = 3;
export const GEMS_PER_LEVEL = 15;

const OP_SYM = { add: '+', sub: '−', mul: '×', div: '÷' };

const HINTS = {
  add: {
    vi: ['Gộp {a} và {b} lại với nhau — đếm thử nhé!', 'Đếm tiếp từ {a}: thêm {b} bước nữa thôi.'],
    en: ['Put {a} and {b} together — try counting!', 'Count on from {a}: just {b} more steps.'],
  },
  sub: {
    vi: ['Bớt {b} khỏi {a} — còn lại bao nhiêu?', 'Đếm lùi từ {a} đúng {b} bước nhé.'],
    en: ['Take {b} away from {a} — how many are left?', 'Count back from {a} exactly {b} steps.'],
  },
  mul: {
    vi: ['{a} nhóm, mỗi nhóm {b} — cộng dồn thử xem!', 'Thử tính {a} × ({b}−1) trước, rồi cộng thêm {b} nữa nhé.'],
    en: ['{a} groups of {b} — try adding them up!', 'Work out {a} × ({b}−1) first, then add one more {b}.'],
  },
  div: {
    vi: ['Chia đều {a} vào {b} nhóm — mỗi nhóm mấy?', 'Nhẩm bảng nhân: {b} nhân mấy thì bằng {a}?'],
    en: ['Share {a} into {b} equal groups — how many each?', 'Times tables: {b} times what makes {a}?'],
  },
};

function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

export function makeQuestion(levelId) {
  const lv = TREASURE_LEVELS[Math.min(Math.max(levelId, 1), TREASURE_LEVELS.length) - 1];
  const op = lv.ops[ri(0, lv.ops.length - 1)];
  let a, b, answer;
  if (op === 'add') {
    if (levelId === 1) { a = ri(2, 10); b = ri(2, Math.min(10, 20 - a)); }
    else { a = ri(11, 80); b = ri(11, Math.min(19, 100 - a)); }
    answer = a + b;
  } else if (op === 'sub') {
    if (levelId === 1) { a = ri(5, 20); b = ri(1, a - 1); }
    else { a = ri(25, 100); b = ri(11, a - 11); }
    answer = a - b;
  } else if (op === 'mul') {
    a = ri(2, 9); b = ri(2, 9); answer = a * b;
  } else {
    b = ri(2, 9); answer = ri(2, 9); a = b * answer;
  }
  return { op, a, b, answer, options: makeOptions(answer, op, a, b) };
}

function shuffled(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeOptions(answer, op, a, b) {
  let cands;
  if (op === 'sub') cands = [a + b, answer + 1, answer - 1, answer + 10];
  else if (op === 'add') cands = [Math.abs(a - b), answer + 1, answer - 1, answer + 10];
  else if (op === 'mul') cands = [a * (b + 1), a * (b - 1), answer + 1, answer - 1];
  else cands = [a - b, a + b, answer + 1, answer - 1];
  const opts = [answer];
  for (const c of shuffled(cands)) {
    if (opts.length >= 3) break;
    if (Number.isInteger(c) && c >= 0 && c !== answer && !opts.includes(c)) opts.push(c);
  }
  let n = 1;
  while (opts.length < 3) { const c = answer + n + 2; if (!opts.includes(c)) opts.push(c); n += 1; }
  return shuffled(opts);
}

export function hintFor(q, step, lang) {
  const pair = HINTS[q.op][lang] || HINTS[q.op].vi;
  const tpl = pair[Math.min(Math.max(step, 0), pair.length - 1)];
  return tpl.split('{a}').join(String(q.a)).split('{b}').join(String(q.b));
}

export function questionPrompt(q, lang, nodeName) {
  const sym = OP_SYM[q.op];
  if (lang === 'en') return '🧩 <strong>' + esc(nodeName) + '</strong><br>The code is: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. What is it?';
  return '🧩 <strong>' + esc(nodeName) + '</strong><br>Cổng cần mã: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. Mã số là bao nhiêu?';
}

export function renderTreasure() {}
