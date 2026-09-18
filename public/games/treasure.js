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
    vi: ['{a} nhóm, mỗi nhóm {b} — cộng dồn thử xem!', 'Nhẩm bảng nhân rồi: {a} nhân {b} bằng mấy nhỉ?'],
    en: ['{a} groups of {b} — try adding them up!', 'Times tables: what is {a} times {b}?'],
  },
  div: {
    vi: ['Chia đều {a} vào {b} nhóm — mỗi nhóm mấy?', 'Nhẩm bảng nhân: {b} nhân mấy thì bằng {a}?'],
    en: ['Share {a} into {b} equal groups — how many each?', 'Times tables: {b} times what makes {a}?'],
  },
};

function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

export function makeQuestion(levelId) {
  const lv = TREASURE_LEVELS[levelId - 1];
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

export function makeOptions(answer, op, a, b) {
  const cands = [answer + 1, answer - 1, op === 'sub' ? a + b : Math.abs(a - b), answer + 10, answer - 10, answer + 2];
  const opts = [answer];
  for (const c of cands) {
    if (opts.length >= 3) break;
    if (c >= 0 && !opts.includes(c)) opts.push(c);
  }
  while (opts.length < 3) opts.push(answer + opts.length + 3);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

export function hintFor(q, step, lang) {
  const pair = HINTS[q.op][lang] || HINTS[q.op].vi;
  const tpl = pair[Math.min(step, pair.length - 1)];
  return tpl.replace('{a}', q.a).replace('{b}', q.b);
}

export function questionPrompt(q, lang, nodeName) {
  const sym = OP_SYM[q.op];
  if (lang === 'en') return '🧩 <strong>' + esc(nodeName) + '</strong><br>The code is: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. What is it?';
  return '🧩 <strong>' + esc(nodeName) + '</strong><br>Cổng cần mã: <strong>' + q.a + ' ' + sym + ' ' + q.b + '</strong>. Mã số là bao nhiêu?';
}

export function renderTreasure() {}
