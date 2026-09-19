import { describe, it, expect } from 'vitest';
import {
  initialState, customState, squareName, squareIndex,
  isAttacked, pseudoMoves,
  applyMove, legalMoves, allLegalMoves, inCheck, status,
} from '../public/games/chess/engine.js';

describe('squares', () => {
  it('maps names and indices both ways', () => {
    expect(squareName(0)).toBe('a8');
    expect(squareName(63)).toBe('h1');
    expect(squareIndex('e1')).toBe(60);
    expect(squareIndex('e8')).toBe(4);
    expect(squareName(squareIndex('d4'))).toBe('d4');
  });
});

describe('initial state', () => {
  it('has 32 pieces, white to move', () => {
    const s = initialState();
    expect(s.turn).toBe('w');
    expect(s.board.filter(Boolean)).toHaveLength(32);
    expect(s.board[squareIndex('e1')]).toEqual({ t: 'k', c: 'w' });
    expect(s.board[squareIndex('d8')]).toEqual({ t: 'q', c: 'b' });
  });
});

describe('isAttacked', () => {
  it('detects pawn attacks', () => {
    const s = customState([['e4', 'p', 'w'], ['d5', 'p', 'b']]);
    expect(isAttacked(s.board, squareIndex('e4'), 'b')).toBe(true);
    expect(isAttacked(s.board, squareIndex('e4'), 'w')).toBe(false);
  });

  it('detects sliding attacks blocked by pieces', () => {
    let s = customState([['a8', 'r', 'b'], ['h1', 'k', 'w']]);
    expect(isAttacked(s.board, squareIndex('a1'), 'b')).toBe(true);
    s = customState([['a8', 'r', 'b'], ['a4', 'p', 'w'], ['h1', 'k', 'w']]);
    expect(isAttacked(s.board, squareIndex('a1'), 'b')).toBe(false);
  });
});

describe('pseudoMoves', () => {
  it('knight on b1 in the initial position can go to a3 and c3 only', () => {
    const s = initialState();
    const mvs = pseudoMoves(s, squareIndex('b1')).map((m) => squareName(m.to)).sort();
    expect(mvs).toEqual(['a3', 'c3']);
  });

  it('pawn can double-push from start, single-push after', () => {
    const s = initialState();
    let mvs = pseudoMoves(s, squareIndex('e2')).map((m) => squareName(m.to)).sort();
    expect(mvs).toEqual(['e3', 'e4']);
    const s2 = customState([['e4', 'p', 'w'], ['h1', 'k', 'w'], ['h8', 'k', 'b']]);
    mvs = pseudoMoves(s2, squareIndex('e4')).map((m) => squareName(m.to));
    expect(mvs).toEqual(['e5']);
  });

  it('pawn captures diagonally and via en-passant flag', () => {
    const s = customState(
      [['e5', 'p', 'w'], ['d5', 'p', 'b'], ['h1', 'k', 'w'], ['h8', 'k', 'b']],
      'w', undefined, squareIndex('d6'));
    const mvs = pseudoMoves(s, squareIndex('e5'));
    const tos = mvs.map((m) => squareName(m.to));
    expect(tos).toContain('d6');
    expect(mvs.find((m) => squareName(m.to) === 'd6').flag).toBe('ep');
  });

  it('king can castle when path is clear and rights remain', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['a1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: true, bk: false, bq: false });
    const mvs = pseudoMoves(s, squareIndex('e1')).map((m) => m.to);
    expect(mvs).toContain(62); // g1
    expect(mvs).toContain(58); // c1
  });

  it('cannot castle through an attacked square', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['f8', 'r', 'b'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: false, bk: false, bq: false });
    const mvs = pseudoMoves(s, squareIndex('e1')).map((m) => m.to);
    expect(mvs).not.toContain(62); // f1 bị xe f8 kiểm soát
  });
});

describe('applyMove', () => {
  it('moves a piece and flips the turn without mutating input', () => {
    const s = initialState();
    const e2 = squareIndex('e2'), e4 = squareIndex('e4');
    const n = applyMove(s, { from: e2, to: e4, flag: 'double' });
    expect(n.board[e2]).toBeNull();
    expect(n.board[e4]).toEqual({ t: 'p', c: 'w' });
    expect(n.turn).toBe('b');
    expect(n.ep).toBe(squareIndex('e3'));
    expect(s.board[e2]).toEqual({ t: 'p', c: 'w' }); // input không đổi
    expect(s.turn).toBe('w');
  });

  it('castles king and rook together', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['h1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: false, bk: false, bq: false });
    const n = applyMove(s, { from: 60, to: 62, flag: 'castle' });
    expect(n.board[squareIndex('g1')].t).toBe('k');
    expect(n.board[squareIndex('f1')].t).toBe('r');
    expect(n.board[squareIndex('e1')]).toBeNull();
    expect(n.board[squareIndex('h1')]).toBeNull();
    expect(n.castling.wk).toBe(false);
  });

  it('captures en passant and removes the passed pawn', () => {
    const s = customState(
      [['e5', 'p', 'w'], ['d5', 'p', 'b'], ['h1', 'k', 'w'], ['h8', 'k', 'b']],
      'w', undefined, squareIndex('d6'));
    const n = applyMove(s, { from: squareIndex('e5'), to: squareIndex('d6'), flag: 'ep' });
    expect(n.board[squareIndex('d6')]).toEqual({ t: 'p', c: 'w' });
    expect(n.board[squareIndex('d5')]).toBeNull(); // tốt đen bị bắt qua đường
    expect(n.board[squareIndex('e5')]).toBeNull();
  });

  it('auto-promotes pawn to queen', () => {
    const s = customState([['a7', 'p', 'w'], ['h1', 'k', 'w'], ['h8', 'k', 'b']]);
    const n = applyMove(s, { from: squareIndex('a7'), to: squareIndex('a8'), flag: null });
    expect(n.board[squareIndex('a8')]).toEqual({ t: 'q', c: 'w' });
  });

  it('queenside castle relocates the rook from a1 to d1', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['a1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: false, wq: true, bk: false, bq: false });
    const n = applyMove(s, { from: 60, to: 58, flag: 'castle' });
    expect(n.board[squareIndex('c1')].t).toBe('k');
    expect(n.board[squareIndex('d1')].t).toBe('r');
    expect(n.board[squareIndex('a1')]).toBeNull();
    expect(n.board[squareIndex('e1')]).toBeNull();
    expect(n.board[squareIndex('b1')]).toBeNull();
  });

  it('queenside castle works for black too', () => {
    const s = customState(
      [['e8', 'k', 'b'], ['a8', 'r', 'b'], ['e1', 'k', 'w']],
      'b', { wk: false, wq: false, bk: false, bq: true });
    const n = applyMove(s, { from: 4, to: 2, flag: 'castle' });
    expect(n.board[squareIndex('c8')].t).toBe('k');
    expect(n.board[squareIndex('d8')].t).toBe('r');
    expect(n.board[squareIndex('a8')]).toBeNull();
  });

  it('capturing a rook on h8 clears black kingside castling right', () => {
    const s = customState(
      [['h8', 'r', 'b'], ['h1', 'r', 'w'], ['e1', 'k', 'w'], ['e8', 'k', 'b']],
      'w', { wk: false, wq: false, bk: true, bq: false });
    const n = applyMove(s, { from: squareIndex('h1'), to: squareIndex('h8'), flag: null });
    expect(n.castling.bk).toBe(false);
  });

  it('castling is refused when the rook has wandered off', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['f1', 'r', 'w'], ['e8', 'k', 'b']],
      'w', { wk: true, wq: true, bk: false, bq: false });
    const tos = pseudoMoves(s, squareIndex('e1')).map((m) => m.to);
    expect(tos).not.toContain(62); // không có xe ở h1
    expect(tos).not.toContain(58); // không có xe ở a1
  });
});

describe('legalMoves and check', () => {
  it('initial position has exactly 20 legal moves', () => {
    expect(allLegalMoves(initialState())).toHaveLength(20);
  });

  it('a pinned knight cannot move', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e3', 'n', 'w'], ['e8', 'r', 'b']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    expect(legalMoves(s, squareIndex('e3'))).toHaveLength(0);
  });

  it('king in check cannot step along the checking line, but can step off it', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e8', 'r', 'b'], ['h8', 'k', 'b'], ['g2', 'p', 'w']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    const tos = legalMoves(s, squareIndex('e1')).map((m) => squareName(m.to));
    expect(tos).not.toContain('e2'); // vẫn nằm trên cột e — xe vẫn chiếu
    expect(tos).toContain('f2');     // bước ra khỏi cột e thì thoát
  });
});

describe('status', () => {
  it("fool's mate is checkmate", () => {
    let s = initialState();
    const mv = (a, b, flag) => { s = applyMove(s, { from: squareIndex(a), to: squareIndex(b), flag: flag || null }); };
    mv('f2', 'f3', 'double');
    mv('e7', 'e5', 'double');
    mv('g2', 'g4', 'double');
    mv('d8', 'h4');
    expect(inCheck(s, 'w')).toBe(true);
    expect(status(s)).toBe('checkmate');
  });

  it('detects stalemate', () => {
    const s = customState(
      [['g6', 'k', 'w'], ['f7', 'q', 'w'], ['h8', 'k', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    expect(status(s)).toBe('stalemate');
  });

  it('reports check when attacked but with escapes', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['e8', 'r', 'b'], ['h8', 'k', 'b'], ['g2', 'p', 'w']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    expect(inCheck(s, 'w')).toBe(true);
    expect(status(s)).toBe('check');
  });
});
