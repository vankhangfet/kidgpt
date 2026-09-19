import { el, SPARK_ICON, BACK_ARROW } from '../dom.js';
import { esc } from '../../util.js';
import { t } from '../../i18n.js';
import { loadProgress, saveProgress } from '../progress.js';
import {
  initialState, applyMove, legalMoves, status, inCheck, findKing,
  squareName,
} from './engine.js';
import { chooseMove, suggestMove } from './bot.js';

const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const NAME = {
  vi: { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' },
  en: { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' },
};
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function renderChess(body, ctx) {
  const L = ctx.lang;
  let stats = loadProgress(ctx.profileId, 'chess') || { won: 0, lost: 0 };
  let states = [initialState()];
  let selected = null;      // ô đang chọn
  let targets = [];         // nước hợp lệ từ ô chọn
  let hintMove = null;
  let over = false;
  let busyBot = false;
  let botTimer = null;

  const score = el('span', 'gt-score', t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost));
  ctx.top.appendChild(score);

  const say = el('div', 'game-say');
  const wrap = el('div', 'chess-wrap');
  const boardEl = el('div', 'chessboard');
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', L === 'en' ? 'Chess board' : 'Bàn cờ');
  const logEl = el('div', 'chess-log');
  const actions = el('div', 'game-actions');

  function cur() { return states[states.length - 1]; }

  function persist() {
    saveProgress(ctx.profileId, 'chess', stats);
    score.textContent = t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost);
  }

  function clearBotTimer() {
    if (botTimer) { clearTimeout(botTimer); botTimer = null; }
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function describeMove(stBefore, m) {
    const p = stBefore.board[m.from];
    const isEp = m.flag === 'ep';
    const victim = isEp ? 'p' : (stBefore.board[m.to] ? stBefore.board[m.to].t : null);
    const captured = victim !== null;
    let txt = GLYPH[p.t] + ' ' + squareName(m.from) + '→' + squareName(m.to);
    if (captured) txt += ' ×' + GLYPH[victim];
    return {
      txt,
      capName: captured ? NAME[L][victim] : null,
      capVal: captured ? VAL[victim] : 0,
    };
  }

  function draw() {
    const st = cur();
    boardEl.innerHTML = '';
    boardEl.classList.toggle('over', over);
    const chkSq = inCheck(st, st.turn) ? findKing(st.board, st.turn) : -1;
    for (let sq = 0; sq < 64; sq++) {
      const r = Math.floor(sq / 8), c = sq % 8;
      const b = el('button', 'sq ' + ((r + c) % 2 === 0 ? 'light' : 'dark'));
      b.type = 'button';
      const p = st.board[sq];
      if (p) {
        b.appendChild(el('span', 'pc ' + p.c, GLYPH[p.t]));
        b.setAttribute('aria-label', NAME[L][p.t] + ' ' + (p.c === 'w' ? (L === 'en' ? 'white' : 'trắng') : (L === 'en' ? 'black' : 'đen')) + ' ' + squareName(sq));
      } else {
        b.setAttribute('aria-label', squareName(sq));
      }
      if (selected === sq) b.classList.add('sel');
      if (targets.some((m) => m.to === sq)) {
        b.classList.add('dest');
        if (st.board[sq] || (sq === st.ep && selected !== null && st.board[selected] && st.board[selected].t === 'p')) b.classList.add('cap');
      }
      if (sq === chkSq) b.classList.add('chk');
      if (hintMove && (sq === hintMove.from || sq === hintMove.to)) b.classList.add('hintmark');
      b.addEventListener('click', () => onSquare(sq));
      boardEl.appendChild(b);
    }
  }

  function onSquare(sq) {
    if (over || busyBot) return;
    const st = cur();
    if (selected !== null) {
      const mv = targets.find((m) => m.to === sq);
      if (mv) { humanMove(mv); return; }
    }
    const p = st.board[sq];
    if (p && p.c === 'w') {
      if (sq === selected) { selected = null; targets = []; hintMove = null; draw(); return; }
      selected = sq;
      targets = legalMoves(st, sq);
      hintMove = null;
    } else {
      selected = null;
      targets = [];
    }
    draw();
  }

  function afterMove(stBefore, m) {
    const info = describeMove(stBefore, m);
    logEl.appendChild(el('span', '', esc(info.txt)));
    const st = cur();
    const s = status(st);
    if (s === 'checkmate') { finish(stBefore.turn); return true; }
    if (s === 'stalemate') { finish(null); return true; }
    if (info.capName) {
      const who = stBefore.turn === 'w' ? 'chCapture' : 'chAte';
      sayMsg(esc(t(L, who).replace('{name}', info.capName).replace('{n}', info.capVal)), stBefore.turn === 'w' ? 'win' : 'warn');
    } else if (s === 'check') {
      sayMsg(esc(t(L, 'chCheck')), 'warn');
    }
    return false;
  }

  function humanMove(mv) {
    const stBefore = cur();
    states.push(applyMove(stBefore, mv));
    selected = null; targets = []; hintMove = null;
    draw();
    if (afterMove(stBefore, mv)) return;
    busyBot = true;
    botTimer = setTimeout(botMove, 450);
  }

  function botMove() {
    botTimer = null;
    if (!boardEl.isConnected) return; // game đã bị tháo khỏi DOM — bỏ nước bot trễ
    const stBefore = cur();
    const mv = chooseMove(stBefore);
    if (!mv) { busyBot = false; finish(null); return; }
    states.push(applyMove(stBefore, mv));
    draw();
    busyBot = false;
    afterMove(stBefore, mv);
  }

  function finish(winnerSide) {
    over = true;
    busyBot = false;
    clearBotTimer();
    draw();
    if (winnerSide === null) {
      sayMsg('🤝 <strong>' + esc(t(L, 'chDraw')) + '</strong>', 'win');
    } else if (winnerSide === 'w') {
      stats.won += 1;
      sayMsg('🏆 <strong>' + esc(t(L, 'chWin')) + '</strong>', 'win');
    } else {
      stats.lost += 1;
      sayMsg('💛 ' + esc(t(L, 'chLose')), 'warn');
    }
    persist();
  }

  function newGame() {
    clearBotTimer();
    states = [initialState()];
    selected = null; targets = []; hintMove = null; over = false; busyBot = false;
    logEl.innerHTML = '';
    sayMsg(esc(t(L, 'chIntro')));
    draw();
  }

  const newBtn = el('button', 'gbtn primary', '♔ ' + esc(t(L, 'chNewGame')));
  newBtn.type = 'button';
  newBtn.addEventListener('click', newGame);

  const undoBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'chUndo')));
  undoBtn.type = 'button';
  undoBtn.addEventListener('click', () => {
    if (busyBot) return;
    clearBotTimer();
    // lùi về lượt người chơi (trắng): bỏ ít nhất 1 state, pop tiếp tới khi tới lượt trắng
    let popped = 0;
    while (states.length > 1 && (popped === 0 || states[states.length - 1].turn !== 'w')) {
      states.pop();
      popped += 1;
    }
    over = false; selected = null; targets = []; hintMove = null;
    draw();
    for (let i = 0; i < popped; i++) {
      if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
    }
  });

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'chHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    if (over || busyBot || cur().turn !== 'w') return;
    const mv = suggestMove(cur());
    if (!mv) return;
    hintMove = mv;
    const p = cur().board[mv.from];
    sayMsg(L === 'en'
      ? '💡 Try moving your <strong>' + esc(NAME.en[p.t]) + '</strong> from ' + squareName(mv.from) + ' to ' + squareName(mv.to) + '.'
      : '💡 Thử đưa <strong>' + esc(NAME.vi[p.t]) + '</strong> từ ' + squareName(mv.from) + ' sang ' + squareName(mv.to) + ' nhé.', 'warn');
    draw();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', () => { clearBotTimer(); ctx.back(); });

  actions.appendChild(newBtn);
  actions.appendChild(undoBtn);
  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);

  wrap.appendChild(boardEl);
  wrap.appendChild(logEl);

  body.appendChild(say);
  body.appendChild(wrap);
  body.appendChild(actions);

  sayMsg(esc(t(L, 'chIntro')));
  draw();
}
