// Sparkle Bot — tìm 2 ply (mình đi + nước đáp trả tốt nhất của đối thủ),
// đánh giá chỉ theo lực quân + nhiễu ngẫu nhiên nhỏ để dễ chơi và không lặp.
import { allLegalMoves, applyMove, inCheck } from './engine.js';

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function material(s) {
  let m = 0;
  for (const p of s.board) if (p) m += (p.c === 'w' ? 1 : -1) * VAL[p.t];
  return m;
}

// Điểm tốt nhất cho phe `s.turn` nhìn `depth` ply phía trước (negamax).
function bestScore(s, depth) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return inCheck(s, s.turn) ? -999 : 0;
  if (depth === 0) {
    const m = material(s);
    return s.turn === 'w' ? m : -m;
  }
  let best = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), depth - 1);
    if (v > best) best = v;
  }
  return best;
}

// Nước đi của bot (phe `s.turn`) — có nhiễu ngẫu nhiên để đỡ máy móc.
export function chooseMove(s) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return null;
  let best = null;
  let bestV = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), 1) + Math.random() * 0.5;
    if (v > bestV) { bestV = v; best = mv; }
  }
  return best;
}

// Gợi ý cho người chơi (phe `s.turn`) — deterministic, không nhiễu.
export function suggestMove(s) {
  const moves = allLegalMoves(s);
  if (moves.length === 0) return null;
  let best = null;
  let bestV = -Infinity;
  for (const mv of moves) {
    const v = -bestScore(applyMove(s, mv), 1);
    if (v > bestV) { bestV = v; best = mv; }
  }
  return best;
}
