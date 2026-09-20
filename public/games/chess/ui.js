import { el, SPARK_ICON, BACK_ARROW } from '../dom.js';
import { esc } from '../../util.js';
import { t } from '../../i18n.js';
import { loadProgress, saveProgress } from '../progress.js';
import {
  initialState, applyMove, legalMoves, status, inCheck, findKing,
  squareName,
} from './engine.js';
import { chooseMove, suggestMove } from './bot.js';
import { glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion } from './fx.js';
import { playSfx, isSoundOn, setSoundOn } from './sfx.js';

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
  let moves = [];      // [{mv, mover, capT}] — song song với states
  let lastMove = null; // mv của nước vừa đi (highlight)
  let fxTimer = null;  // dọn pháo giấy/trái tim

  const score = el('span', 'gt-score', t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost));
  ctx.top.appendChild(score);

  const say = el('div', 'game-say');
  const wrap = el('div', 'chess-wrap');
  const boardEl = el('div', 'chessboard');
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', L === 'en' ? 'Chess board' : 'Bàn cờ');
  const logEl = el('div', 'chess-log');
  const posEl = el('div', 'chess-pos');
  const fxEl = el('div', 'chess-fx');
  const traysEl = el('div', 'trays');
  const trayW = el('div', 'tray');
  const trayB = el('div', 'tray');
  const actions = el('div', 'game-actions');

  function cur() { return states[states.length - 1]; }

  function persist() {
    saveProgress(ctx.profileId, 'chess', stats);
    score.textContent = t(L, 'chStats').replace('{w}', stats.won).replace('{l}', stats.lost);
  }

  function clearBotTimer() {
    if (botTimer) { clearTimeout(botTimer); botTimer = null; }
  }

  function clearFxTimer() {
    if (fxTimer) { clearTimeout(fxTimer); fxTimer = null; }
  }

  function clearFx() {
    clearFxTimer();
    fxEl.innerHTML = '';
  }

  function playAndClearFx(ms) {
    clearFxTimer();
    fxTimer = setTimeout(() => {
      if (fxEl.isConnected) fxEl.innerHTML = '';
      fxTimer = null;
    }, ms);
  }

  function renderTrays() {
    const { byW, byB } = traysFromMoves(moves);
    trayW.innerHTML = byW.length
      ? '<span class="t-label">' + esc(t(L, 'chYouTook')) + '</span><span class="t-pcs b">' + byW.slice(0, 15).map((tp) => GLYPH[tp]).join('') + '</span>'
      : '';
    trayB.innerHTML = byB.length
      ? '<span class="t-label">' + esc(t(L, 'chBotTook')) + '</span><span class="t-pcs w">' + byB.slice(0, 15).map((tp) => GLYPH[tp]).join('') + '</span>'
      : '';
    trayW.style.display = byW.length ? '' : 'none';
    trayB.style.display = byB.length ? '' : 'none';
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
      victim: victim,
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
    if (lastMove) {
      if (boardEl.children[lastMove.from]) boardEl.children[lastMove.from].classList.add('last');
      if (boardEl.children[lastMove.to]) boardEl.children[lastMove.to].classList.add('last');
    }
  }

  function applyGlide(move, victimType) {
    if (prefersReducedMotion()) return;
    const bFrom = boardEl.children[move.from];
    const bTo = boardEl.children[move.to];
    if (!bFrom || !bTo) return;
    const piece = bTo.querySelector('.pc');
    if (piece) {
      const d = glideDelta(bFrom.getBoundingClientRect(), bTo.getBoundingClientRect());
      if (d.dx || d.dy) {
        piece.style.transition = 'none';
        piece.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px)';
        void piece.offsetWidth; // ép reflow rồi thả transition
        piece.style.transition = '';
        piece.style.transform = '';
      }
    }
    if (move.flag === 'castle') {
      const kingSide = move.to > move.from;
      const rookFrom = kingSide ? move.from + 3 : move.from - 4;
      const rookTo = kingSide ? move.from + 1 : move.from - 1;
      const rookEl = boardEl.children[rookTo] && boardEl.children[rookTo].querySelector('.pc');
      if (rookEl && boardEl.children[rookFrom]) {
        const d = glideDelta(boardEl.children[rookFrom].getBoundingClientRect(), boardEl.children[rookTo].getBoundingClientRect());
        if (d.dx || d.dy) {
          rookEl.style.transition = 'none';
          rookEl.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px)';
          void rookEl.offsetWidth;
          rookEl.style.transition = '';
          rookEl.style.transform = '';
        }
      }
    }
    if (victimType) {
      const r = Math.floor(move.to / 8), c = move.to % 8;
      // sau applyMove, cur().turn là phe ĐỐI PHƯƠNG của người vừa đi —
      // quân bị ăn cùng phe với cur().turn nên ghost nhận class tương ứng
      const ghost = el('div', 'ghost-cap',
        '<span class="pc ' + (cur().turn === 'w' ? 'w' : 'b') + '" aria-hidden="true">' + GLYPH[victimType] + '</span>');
      ghost.style.left = (c * 12.5) + '%';
      ghost.style.top = (r * 12.5) + '%';
      ghost.style.width = '12.5%';
      ghost.style.height = '12.5%';
      fxEl.appendChild(ghost);
      playAndClearFx(400);
    }
  }

  function onSquare(sq) {
    if (over || busyBot) return;
    clearFxTimer();
    fxEl.innerHTML = '';
    hintMove = null;
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

  function afterMove(stBefore, m, info) {
    logEl.appendChild(el('span', '', esc(info.txt)));
    moves.push({ mv: m, mover: stBefore.turn, capT: info.victim });
    lastMove = m;
    renderTrays();
    playSfx(info.victim ? 'capture' : 'move');
    const st = cur();
    const s = status(st);
    if (s === 'checkmate') { finish(stBefore.turn); return true; }
    if (s === 'stalemate') { finish(null); return true; }
    if (s === 'check') {
      if (!info.victim) playSfx('check');
      sayMsg(esc(t(L, 'chCheck')), 'warn');
    } else if (info.capName) {
      const who = stBefore.turn === 'w' ? 'chCapture' : 'chAte';
      sayMsg(esc(t(L, who).replace('{name}', info.capName).replace('{n}', info.capVal)), stBefore.turn === 'w' ? 'win' : 'warn');
    } else if (stBefore.turn === 'b') {
      sayMsg(esc(t(L, 'chYourTurn')));
    }
    return false;
  }

  function sayThinking() {
    say.className = 'game-say';
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' +
      esc(t(L, 'chThinking')) +
      ' <span class="thinking"><span></span><span></span><span></span></span></div>';
  }

  function humanMove(mv) {
    const stBefore = cur();
    const info = describeMove(stBefore, mv);
    states.push(applyMove(stBefore, mv));
    selected = null; targets = []; hintMove = null;
    fxEl.innerHTML = '';
    draw();
    applyGlide(mv, info.victim);
    if (afterMove(stBefore, mv, info)) return;
    sayThinking();
    busyBot = true;
    botTimer = setTimeout(botMove, 450);
  }

  function botMove() {
    botTimer = null;
    if (!boardEl.isConnected) return; // game đã bị tháo khỏi DOM — bỏ nước bot trễ
    const stBefore = cur();
    const mv = chooseMove(stBefore);
    if (!mv) { busyBot = false; finish(null); return; }
    const info = describeMove(stBefore, mv);
    states.push(applyMove(stBefore, mv));
    draw();
    applyGlide(mv, info.victim);
    busyBot = false;
    afterMove(stBefore, mv, info);
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
      playSfx('win');
      sayMsg('🏆 <strong>' + esc(t(L, 'chWin')) + '</strong>', 'win');
      celebrate();
    } else {
      stats.lost += 1;
      playSfx('lose');
      sayMsg('💛 ' + esc(t(L, 'chLose')), 'warn');
      dropHearts();
    }
    persist();
  }

  function celebrate() {
    if (prefersReducedMotion()) return;
    boardEl.classList.add('celebrate');
    for (const p of confettiSpec()) {
      const bit = el('div', 'confetti-bit');
      bit.style.left = p.left + '%';
      bit.style.background = p.color;
      bit.style.animationDelay = p.delay + 'ms';
      bit.style.animationDuration = p.duration + 'ms';
      bit.style.setProperty('--cr', (p.rotate + 540) + 'deg');
      fxEl.appendChild(bit);
    }
    playAndClearFx(2000);
  }

  function dropHearts() {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < 6; i++) {
      const h = el('div', 'heart-bit', '<span aria-hidden="true">💛</span>');
      h.style.left = (10 + i * 15) + '%';
      h.style.animationDelay = (i * 120) + 'ms';
      fxEl.appendChild(h);
    }
    playAndClearFx(2200);
  }

  function newGame() {
    clearBotTimer();
    clearFx();
    states = [initialState()];
    moves = [];
    lastMove = null;
    selected = null; targets = []; hintMove = null; over = false; busyBot = false;
    boardEl.classList.remove('celebrate');
    logEl.innerHTML = '';
    renderTrays();
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
    clearFx();
    let popped = 0;
    while (states.length > 1 && (popped === 0 || states[states.length - 1].turn !== 'w')) {
      states.pop();
      if (moves.length) moves.pop();
      popped += 1;
    }
    lastMove = moves.length ? moves[moves.length - 1].mv : null;
    over = false; selected = null; targets = []; hintMove = null;
    boardEl.classList.remove('celebrate');
    renderTrays();
    draw();
    for (let i = 0; i < popped; i++) {
      if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
    }
  });

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'chHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    clearFxTimer();
    if (over || busyBot || cur().turn !== 'w') return;
    const mv = suggestMove(cur());
    if (!mv) return;
    hintMove = mv;
    playSfx('hint');
    draw();
    drawHintArrow(mv);
    const p = cur().board[mv.from];
    sayMsg(L === 'en'
      ? '💡 Try moving your <strong>' + esc(NAME.en[p.t]) + '</strong> from ' + squareName(mv.from) + ' to ' + squareName(mv.to) + '.'
      : '💡 Thử đưa <strong>' + esc(NAME.vi[p.t]) + '</strong> từ ' + squareName(mv.from) + ' sang ' + squareName(mv.to) + ' nhé.', 'warn');
  });

  function drawHintArrow(mv) {
    if (prefersReducedMotion()) return;
    const bRect = boardEl.getBoundingClientRect();
    const fromR = boardEl.children[mv.from].getBoundingClientRect();
    const toR = boardEl.children[mv.to].getBoundingClientRect();
    const g = arrowPct(bRect, fromR, toR);
    const head = arrowHead(g.x1, g.y1, g.x2, g.y2);
    fxEl.innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<polyline class="hint-arrow-line" points="' + g.x1 + ',' + g.y1 + ' ' + g.x2 + ',' + g.y2 + '"/>' +
      '<polygon class="hint-arrow-head" points="' + head + '"/></svg>';
  }

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', () => { clearBotTimer(); clearFx(); ctx.back(); });

  const soundBtn = el('button', 'gbtn ghost', isSoundOn() ? '🔊' : '🔇');
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', t(L, isSoundOn() ? 'soundOn' : 'soundOff'));
  soundBtn.addEventListener('click', () => {
    const on = !isSoundOn();
    setSoundOn(on);
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', t(L, on ? 'soundOn' : 'soundOff'));
    if (on) playSfx('hint');
  });

  actions.appendChild(newBtn);
  actions.appendChild(undoBtn);
  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);
  actions.appendChild(soundBtn);

  posEl.appendChild(boardEl);
  posEl.appendChild(fxEl);
  traysEl.appendChild(trayW);
  traysEl.appendChild(trayB);
  wrap.appendChild(posEl);
  wrap.appendChild(traysEl);
  wrap.appendChild(logEl);

  body.appendChild(say);
  body.appendChild(wrap);
  body.appendChild(actions);

  sayMsg(esc(t(L, 'chIntro')));
  draw();
  renderTrays();
}
