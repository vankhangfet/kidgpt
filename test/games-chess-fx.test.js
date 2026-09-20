import { describe, it, expect } from 'vitest';
import {
  glideDelta, arrowPct, arrowHead, confettiSpec, traysFromMoves, prefersReducedMotion,
} from '../public/games/chess/fx.js';

describe('glideDelta', () => {
  it('returns offset from destination back to source (FLIP translate)', () => {
    const from = { left: 0, top: 300, width: 50, height: 50 };
    const to = { left: 300, top: 300, width: 50, height: 50 };
    expect(glideDelta(from, to)).toEqual({ dx: -300, dy: 0 });
    const from2 = { left: 300, top: 0, width: 50, height: 50 };
    const to2 = { left: 300, top: 350, width: 50, height: 50 };
    expect(glideDelta(from2, to2)).toEqual({ dx: 0, dy: -350 });
  });
});

describe('arrowPct', () => {
  const board = { left: 0, top: 0, width: 400, height: 400 };
  it('converts square centers to board % and shrinks by pad', () => {
    const from = { left: 0, top: 300, width: 50, height: 50 };    // center (25,325)
    const to = { left: 300, top: 300, width: 50, height: 50 };    // center (325,325)
    expect(arrowPct(board, from, to, 14)).toEqual({ x1: 20.25, y1: 81.25, x2: 63.25, y2: 81.25 });
  });
  it('stays within 0..100 for a long diagonal', () => {
    const from = { left: 0, top: 0, width: 50, height: 50 };
    const to = { left: 350, top: 350, width: 50, height: 50 };
    const g = arrowPct(board, from, to, 10);
    for (const v of [g.x1, g.y1, g.x2, g.y2]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('arrowHead', () => {
  it('points right for a horizontal arrow', () => {
    expect(arrowHead(10, 50, 60, 50)).toBe('64,50 58,47.5 58,52.5');
  });
  it('points down for a vertical arrow', () => {
    const pts = arrowHead(50, 10, 50, 60).split(' ').map((p) => p.split(',').map(Number));
    expect(pts[0][0]).toBeCloseTo(50);
    expect(pts[0][1]).toBeCloseTo(64);
  });
});

describe('confettiSpec', () => {
  it('builds 24 pieces with deterministic values from a seeded rng', () => {
    const spec = confettiSpec(() => 0.5);
    expect(spec).toHaveLength(24);
    for (const p of spec) {
      expect(p.left).toBe(50);
      expect(p.delay).toBe(150);
      expect(p.duration).toBeGreaterThanOrEqual(1100);
      expect(p.duration).toBeLessThanOrEqual(1600);
      expect(p.rotate).toBe(180);
      expect(p.color).toMatch(/^#/);
    }
  });
});

describe('traysFromMoves', () => {
  it('splits captures by mover, skipping quiet moves', () => {
    const moves = [
      { mover: 'w', capT: 'q' },
      { mover: 'b', capT: null },
      { mover: 'b', capT: 'p' },
      { mover: 'w', capT: 'p' },
    ];
    expect(traysFromMoves(moves)).toEqual({ byW: ['q', 'p'], byB: ['p'] });
  });
  it('empty moves give empty trays', () => {
    expect(traysFromMoves([])).toEqual({ byW: [], byB: [] });
  });
});

describe('prefersReducedMotion', () => {
  it('reads matchMedia when present', () => {
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) })).toBe(false);
  });
  it('defaults to false without matchMedia', () => {
    expect(prefersReducedMotion({})).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });
});
