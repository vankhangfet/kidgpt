// Bộ luật cờ vua thu gọn cho trẻ — pure functions, KHÔNG mutate state đầu vào.
// Hỗ trợ: đi/ăn quân, nhập thành 2 phía, bắt tốt qua đường (en passant),
// phong cấp (tự động thành Hậu), chiếu / chiếu hết / hết nước (hòa).
// Bỏ qua (cố ý, cho gọn): luật 50 nước, lặp 3 lần, underpromotion.
//
// Quy ước ô: index 0..63, 0 = a8 (trên trái), 63 = h1 (dưới phải).
// row = Math.floor(sq / 8)  (row 0 = rank 8), col = sq % 8 (col 0 = file a).

const FILES = 'abcdefgh';

export function squareName(sq) {
  return FILES[sq % 8] + (8 - Math.floor(sq / 8));
}

export function squareIndex(name) {
  const file = FILES.indexOf(name[0]);
  const rank = Number(name[1]);
  return (8 - rank) * 8 + file;
}

const START_ROWS = [
  ['a8', 'r', 'b'], ['b8', 'n', 'b'], ['c8', 'b', 'b'], ['d8', 'q', 'b'],
  ['e8', 'k', 'b'], ['f8', 'b', 'b'], ['g8', 'n', 'b'], ['h8', 'r', 'b'],
  ['a7', 'p', 'b'], ['b7', 'p', 'b'], ['c7', 'p', 'b'], ['d7', 'p', 'b'],
  ['e7', 'p', 'b'], ['f7', 'p', 'b'], ['g7', 'p', 'b'], ['h7', 'p', 'b'],
  ['a2', 'p', 'w'], ['b2', 'p', 'w'], ['c2', 'p', 'w'], ['d2', 'p', 'w'],
  ['e2', 'p', 'w'], ['f2', 'p', 'w'], ['g2', 'p', 'w'], ['h2', 'p', 'w'],
  ['a1', 'r', 'w'], ['b1', 'n', 'w'], ['c1', 'b', 'w'], ['d1', 'q', 'w'],
  ['e1', 'k', 'w'], ['f1', 'b', 'w'], ['g1', 'n', 'w'], ['h1', 'r', 'w'],
];

export function customState(entries, turn = 'w', castling, ep = -1) {
  const board = new Array(64).fill(null);
  for (const [sq, t, c] of entries) board[squareIndex(sq)] = { t, c };
  return {
    board,
    turn,
    castling: castling || { wk: true, wq: true, bk: true, bq: true },
    ep,
  };
}

export function initialState() {
  return customState(START_ROWS, 'w', { wk: true, wq: true, bk: true, bq: true }, -1);
}

function clone(s) {
  return {
    board: s.board.map((p) => (p ? { t: p.t, c: p.c } : null)),
    turn: s.turn,
    castling: { ...s.castling },
    ep: s.ep,
  };
}

const KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function rc(sq) { return [Math.floor(sq / 8), sq % 8]; }
function inB(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// Ô sq có bị phe `by` tấn công không (chỉ nhìn bàn, không xét nước đi)
export function isAttacked(board, sq, by) {
  const [r, c] = rc(sq);
  // tốt: tốt trắng ở (r+1, c±1) tấn công ô (r,c); tốt đen ở (r-1, c±1)
  const pr = by === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    const cc = c + dc;
    if (inB(pr, cc)) {
      const p = board[pr * 8 + cc];
      if (p && p.c === by && p.t === 'p') return true;
    }
  }
  for (const [dr, dc] of KNIGHT_D) {
    const rr = r + dr, cc = c + dc;
    if (!inB(rr, cc)) continue;
    const p = board[rr * 8 + cc];
    if (p && p.c === by && p.t === 'n') return true;
  }
  for (const [dr, dc] of KING_D) {
    const rr = r + dr, cc = c + dc;
    if (!inB(rr, cc)) continue;
    const p = board[rr * 8 + cc];
    if (p && p.c === by && p.t === 'k') return true;
  }
  for (const [dr, dc] of BISHOP_D) {
    let rr = r + dr, cc = c + dc;
    while (inB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) {
        if (p.c === by && (p.t === 'b' || p.t === 'q')) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of ROOK_D) {
    let rr = r + dr, cc = c + dc;
    while (inB(rr, cc)) {
      const p = board[rr * 8 + cc];
      if (p) {
        if (p.c === by && (p.t === 'r' || p.t === 'q')) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  return false;
}

export function findKing(board, side) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.t === 'k' && p.c === side) return i;
  }
  return -1;
}

// Nước đi thô (chưa lọc vua bị lộ sau nước đi)
export function pseudoMoves(s, from) {
  const p = s.board[from];
  if (!p || p.c !== s.turn) return [];
  const out = [];
  const [r, c] = rc(from);
  const add = (rr, cc, flag) => {
    if (!inB(rr, cc)) return;
    const target = s.board[rr * 8 + cc];
    if (target && target.c === p.c) return;
    out.push({ from, to: rr * 8 + cc, flag: flag || null });
  };
  if (p.t === 'p') {
    const dir = p.c === 'w' ? -1 : 1;
    const startRow = p.c === 'w' ? 6 : 1;
    const rr = r + dir;
    if (inB(rr, c) && !s.board[rr * 8 + c]) {
      out.push({ from, to: rr * 8 + c, flag: null });
      const rr2 = r + 2 * dir;
      if (r === startRow && !s.board[rr2 * 8 + c]) out.push({ from, to: rr2 * 8 + c, flag: 'double' });
    }
    for (const dc of [-1, 1]) {
      const cc = c + dc;
      if (!inB(rr, cc)) continue;
      const idx = rr * 8 + cc;
      const target = s.board[idx];
      if (target && target.c !== p.c) out.push({ from, to: idx, flag: null });
      else if (idx === s.ep && !target) out.push({ from, to: idx, flag: 'ep' });
    }
  } else if (p.t === 'n' || p.t === 'k') {
    for (const [dr, dc] of (p.t === 'n' ? KNIGHT_D : KING_D)) add(r + dr, c + dc);
    if (p.t === 'k') {
      const home = p.c === 'w' ? 60 : 4;
      const enemy = p.c === 'w' ? 'b' : 'w';
      if (from === home && !isAttacked(s.board, home, enemy)) {
        const ks = p.c === 'w' ? s.castling.wk : s.castling.bk;
        const qs = p.c === 'w' ? s.castling.wq : s.castling.bq;
        if (ks && s.board[home + 3] && s.board[home + 3].t === 'r' && s.board[home + 3].c === p.c
          && !s.board[home + 1] && !s.board[home + 2]
          && !isAttacked(s.board, home + 1, enemy) && !isAttacked(s.board, home + 2, enemy)) {
          out.push({ from, to: home + 2, flag: 'castle' });
        }
        if (qs && s.board[home - 4] && s.board[home - 4].t === 'r' && s.board[home - 4].c === p.c
          && !s.board[home - 1] && !s.board[home - 2] && !s.board[home - 3]
          && !isAttacked(s.board, home - 1, enemy) && !isAttacked(s.board, home - 2, enemy)) {
          out.push({ from, to: home - 2, flag: 'castle' });
        }
      }
    }
  } else {
    const dirs = p.t === 'b' ? BISHOP_D : p.t === 'r' ? ROOK_D : BISHOP_D.concat(ROOK_D);
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inB(rr, cc)) {
        const target = s.board[rr * 8 + cc];
        if (target && target.c === p.c) break;
        out.push({ from, to: rr * 8 + cc, flag: null });
        if (target) break;
        rr += dr; cc += dc;
      }
    }
  }
  return out;
}

// Áp nước đi, trả về state MỚI (không đổi state đầu vào).
export function applyMove(s, m) {
  const n = clone(s);
  const p = n.board[m.from];
  n.board[m.from] = null;
  const lastRow = p.c === 'w' ? 0 : 7;
  if (p.t === 'p' && Math.floor(m.to / 8) === lastRow) n.board[m.to] = { t: 'q', c: p.c };
  else n.board[m.to] = p;
  if (m.flag === 'ep') {
    const cap = m.to + (p.c === 'w' ? 8 : -8);
    n.board[cap] = null;
  }
  if (m.flag === 'castle') {
    const home = p.c === 'w' ? 60 : 4;
    if (m.to === home + 2) { n.board[home + 1] = n.board[home + 3]; n.board[home + 3] = null; }
    else { n.board[home - 1] = n.board[home - 4]; n.board[home - 4] = null; }
  }
  n.ep = m.flag === 'double' ? (m.from + m.to) / 2 : -1;
  if (p.t === 'k') {
    if (p.c === 'w') { n.castling.wk = false; n.castling.wq = false; }
    else { n.castling.bk = false; n.castling.bq = false; }
  }
  for (const sq of [56, 63, 0, 7]) {
    if (m.from === sq || m.to === sq) {
      if (sq === 56) n.castling.wq = false;
      if (sq === 63) n.castling.wk = false;
      if (sq === 0) n.castling.bq = false;
      if (sq === 7) n.castling.bk = false;
    }
  }
  n.turn = s.turn === 'w' ? 'b' : 'w';
  return n;
}

// Phe `side` có đang bị chiếu không?
export function inCheck(s, side) {
  const k = findKing(s.board, side);
  return k >= 0 && isAttacked(s.board, k, side === 'w' ? 'b' : 'w');
}

// Nước đi hợp lệ = nước thô mà sau đó vua mình KHÔNG bị chiếu.
export function legalMoves(s, from) {
  return pseudoMoves(s, from).filter((m) => !inCheck(applyMove(s, m), s.turn));
}

export function allLegalMoves(s) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p && p.c === s.turn) out.push(...legalMoves(s, i));
  }
  return out;
}

export function status(s) {
  if (allLegalMoves(s).length === 0) return inCheck(s, s.turn) ? 'checkmate' : 'stalemate';
  return inCheck(s, s.turn) ? 'check' : 'playing';
}
