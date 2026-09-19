import { describe, it, expect } from 'vitest';
import { customState, squareIndex, applyMove, status } from '../public/games/chess/engine.js';
import { chooseMove, suggestMove } from '../public/games/chess/bot.js';

describe('sparkle bot', () => {
  it('captures a hanging queen', () => {
    // Hậu trắng d5 không được bảo vệ; xe đen d8 ăn được (đường d7-d6 trống)
    const s = customState(
      [['e1', 'k', 'w'], ['d5', 'q', 'w'], ['e8', 'k', 'b'], ['d8', 'r', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    const mv = chooseMove(s);
    expect(mv).not.toBeNull();
    expect(mv.to).toBe(squareIndex('d5'));
  });

  it('suggestMove finds mate in one', () => {
    // Trắng: Vb6 + Hc7; Đen: Va8 → Hc7-b7 là chiếu hết
    const s = customState(
      [['b6', 'k', 'w'], ['c7', 'q', 'w'], ['a8', 'k', 'b']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    const mv = suggestMove(s);
    expect(mv).not.toBeNull();
    expect(mv.from).toBe(squareIndex('c7'));
    expect(status(applyMove(s, mv))).toBe('checkmate');
  });

  it('returns null when no moves (stalemate)', () => {
    const s = customState(
      [['g6', 'k', 'w'], ['f7', 'q', 'w'], ['h8', 'k', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    expect(chooseMove(s)).toBeNull();
  });

  it('deterministic hint ignores noise', () => {
    const s = customState(
      [['e1', 'k', 'w'], ['d5', 'q', 'w'], ['e8', 'k', 'b'], ['d8', 'r', 'b']],
      'b', { wk: false, wq: false, bk: false, bq: false });
    const a = suggestMove(s);
    const b = suggestMove(s);
    expect(a).toEqual(b);
    expect(a.to).toBe(squareIndex('d5'));
  });

  it('grabs a free pawn when nothing better exists', () => {
    // Tốt đen c5 không được bảo vệ; Mã trắng d3 ăn được (d3→c5 là nước mã)
    const s = customState(
      [['e1', 'k', 'w'], ['d3', 'n', 'w'], ['e8', 'k', 'b'], ['c5', 'p', 'b']],
      'w', { wk: false, wq: false, bk: false, bq: false });
    const mv = suggestMove(s);
    expect(mv.to).toBe(squareIndex('c5'));
  });
});
