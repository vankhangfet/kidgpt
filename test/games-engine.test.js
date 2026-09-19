import { describe, it, expect } from 'vitest';
import {
  initialState, customState, squareName, squareIndex,
  isAttacked, pseudoMoves,
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
