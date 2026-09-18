import { el, SPARK_ICON, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t, STRINGS } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';

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

export function renderTreasure(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'treasure') ||
    { level: 1, maxLevel: 1, node: 0, qIdx: 0, gems: 0, total: 0 };
  let q = null;
  let wrong = 0;

  const score = el('span', 'gt-score', '💎 ' + save.total);
  ctx.top.appendChild(score);

  const levelRow = el('div', 'level-row');
  const mapEl = el('div', 'treasure-map');
  const tray = el('div', 'gem-tray');
  const say = el('div', 'game-say');
  const opts = el('div', 'opt-row');
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'treasure', save);
    score.textContent = '💎 ' + save.total;
  }

  function drawLevels() {
    levelRow.innerHTML = '';
    TREASURE_LEVELS.forEach((lv) => {
      const pill = el('span', 'level-pill' + (lv.id === save.level ? ' active' : ''));
      pill.textContent = 'Lv ' + lv.id + ' · ' + t(L, 'trLv' + lv.id);
      if (lv.id > save.maxLevel) pill.classList.add('locked');
      else if (lv.id !== save.level) {
        pill.style.cursor = 'pointer';
        pill.title = t(L, 'gameGo');
        pill.addEventListener('click', () => {
          save.level = lv.id; save.node = 0; save.qIdx = 0; save.gems = 0;
          persist(); draw(); newQ();
        });
      }
      levelRow.appendChild(pill);
    });
  }

  function drawMap() {
    mapEl.innerHTML = '';
    const path = el('div', 'tm-path');
    path.appendChild(el('div', 'tm-line'));
    NODE_EMOJIS.forEach((e, i) => {
      const cls = i < save.node ? ' done' : i === save.node ? ' current' : ' locked';
      path.appendChild(el('div', 'tm-node' + cls,
        '<div class="tm-dot">' + e + '</div><div class="tm-label">' + esc(t(L, 'trNode' + (i + 1))) + '</div>'));
    });
    mapEl.appendChild(path);
  }

  function drawTray() {
    tray.innerHTML = '<span class="gt-cap">' + esc(t(L, 'gemsLabel')) + ' · ' + save.gems + '/' + GEMS_PER_LEVEL + '</span>';
    const gems = el('div', 'gems');
    for (let i = 0; i < GEMS_PER_LEVEL; i++) gems.appendChild(el('span', 'gem' + (i < save.gems ? '' : ' ghost')));
    tray.appendChild(gems);
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function draw() { drawLevels(); drawMap(); drawTray(); }

  function newQ() {
    wrong = 0;
    q = makeQuestion(save.level);
    sayMsg(questionPrompt(q, L, t(L, 'trNode' + (save.node + 1))));
    drawOpts();
  }

  function drawOpts() {
    opts.innerHTML = '';
    q.options.forEach((v) => {
      const b = el('button', 'opt', esc(String(v)));
      b.type = 'button';
      b.addEventListener('click', () => onPick(b, v));
      opts.appendChild(b);
    });
  }

  function cheer() {
    const list = STRINGS[L].cheers;
    return list[Math.floor(Math.random() * list.length)];
  }

  function onPick(btn, v) {
    if (v === q.answer) {
      btn.classList.add('right');
      opts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      save.gems += 1;
      save.total += 1;
      save.qIdx += 1;
      persist();
      if (save.qIdx >= QUESTIONS_PER_NODE) {
        save.node += 1;
        save.qIdx = 0;
        if (save.node >= NODE_EMOJIS.length) levelDone();
        else nodeDone();
      } else {
        sayMsg('✨ <strong>' + esc(cheer()) + '</strong>', 'win');
        setTimeout(newQ, 700);
      }
      persist();
      drawMap();
      drawTray();
    } else {
      btn.classList.add('wrong');
      wrong += 1;
      sayMsg('💡 ' + esc(hintFor(q, Math.min(wrong, 2) - 1, L)), 'warn');
    }
  }

  function nodeDone() {
    draw();
    sayMsg('🎉 <strong>' + esc(t(L, 'trNode' + save.node)) + '</strong> — ' +
      (L === 'en' ? 'checkpoint cleared! On we go!' : 'qua chặng rồi, tiến tiếp nào!'), 'win');
    setTimeout(newQ, 900);
  }

  function levelDone() {
    if (save.level < TREASURE_LEVELS.length) {
      save.maxLevel = Math.max(save.maxLevel, save.level + 1);
      save.level += 1;
      save.node = 0; save.qIdx = 0; save.gems = 0;
      persist(); draw();
      sayMsg('🏆 <strong>' + esc(t(L, 'trLv' + save.level)) + '</strong> — ' +
        (L === 'en' ? 'level complete! A new island map unlocks!' : 'hoàn thành cấp độ! Mở bản đồ mới!'), 'win');
      setTimeout(newQ, 1100);
    } else {
      save.node = 0; save.qIdx = 0; save.gems = 0;
      persist(); draw();
      sayMsg('🏴‍☠️💎 <strong>' + (L === 'en' ? 'The Lost Treasure is YOURS!' : 'Kho báu thất truyền là của bạn!') +
        '</strong> ' + (L === 'en' ? 'Play this level again or collect more gems!' : 'Chơi lại cấp này hoặc gom thêm kim cương nhé!'), 'win');
      setTimeout(newQ, 1100);
    }
  }

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'needHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    if (!q) return;
    sayMsg('💡 ' + esc(hintFor(q, 0, L)), 'warn');
  });

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearProgress(ctx.profileId, 'treasure');
    save = { level: 1, maxLevel: 1, node: 0, qIdx: 0, gems: 0, total: 0 };
    persist(); draw(); newQ();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', ctx.back);

  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  body.appendChild(levelRow);
  body.appendChild(mapEl);
  body.appendChild(tray);
  body.appendChild(say);
  body.appendChild(opts);
  body.appendChild(actions);

  draw();
  newQ();
}
