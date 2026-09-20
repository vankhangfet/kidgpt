import { describe, it, expect, beforeEach } from 'vitest';
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

  it('one-square move keeps the head pointing at the target (default pad)', () => {
    const board = { left: 0, top: 0, width: 400, height: 400 };
    const from = { left: 0, top: 300, width: 50, height: 50 };   // center 6.25, 81.25
    const to = { left: 0, top: 250, width: 50, height: 50 };     // center 6.25, 68.75 (1 ô lên trên)
    const g = arrowPct(board, from, to);
    expect(g).toEqual({ x1: 6.25, y1: 79, x2: 6.25, y2: 75 });
    expect(Math.abs(g.y2 - 68.75)).toBeLessThan(Math.abs(g.y1 - 68.75)); // đầu mũi tên gần đích hơn
  });

  it('two-square move keeps the head pointing at the target (default pad)', () => {
    const board = { left: 0, top: 0, width: 400, height: 400 };
    const from = { left: 0, top: 300, width: 50, height: 50 };
    const to = { left: 0, top: 200, width: 50, height: 50 };     // 2 ô lên trên
    const g = arrowPct(board, from, to);
    expect(g.y2).toBeLessThan(g.y1);
    expect(Math.abs(g.y2 - 56.25)).toBeLessThan(Math.abs(g.y1 - 56.25));
  });

  it('returns zeros for an unlayouted board', () => {
    expect(arrowPct({ left: 0, top: 0, width: 0, height: 0 },
      { left: 0, top: 0, width: 50, height: 50 },
      { left: 300, top: 0, width: 50, height: 50 })).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
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

import { playSfx, isSoundOn, setSoundOn } from '../public/games/chess/sfx.js';

describe('sfx', () => {
  const store = new Map();
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  });

  it('defaults to on and toggles persistently', () => {
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
    setSoundOn(true);
    expect(isSoundOn()).toBe(true);
  });

  it('is silent and never throws without AudioContext', () => {
    const AC = globalThis.AudioContext;
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
    expect(() => playSfx('move')).not.toThrow();
    globalThis.AudioContext = AC;
  });

  it('drives oscillators when a context exists', () => {
    let started = 0;
    class FakeGain {
      constructor() { this.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
      connect() {}
    }
    class FakeOsc {
      constructor() { this.type = ''; this.frequency = { value: 0 }; }
      connect() {}
      start() { started += 1; }
      stop() {}
    }
    globalThis.AudioContext = class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new FakeOsc(); }
      createGain() { return new FakeGain(); }
    };
    playSfx('move');
    expect(started).toBe(1);
    playSfx('win');
    expect(started).toBe(4); // arpeggio 3 nốt
    playSfx('nope');
    expect(started).toBe(4); // hiệu ứng lạ → bỏ qua
  });

  it('muted sound plays nothing', () => {
    let started = 0;
    class FakeGain {
      constructor() { this.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
      connect() {}
    }
    class FakeOsc {
      constructor() { this.type = ''; this.frequency = { value: 0 }; }
      connect() {}
      start() { started += 1; }
      stop() {}
    }
    globalThis.AudioContext = class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return new FakeOsc(); }
      createGain() { return new FakeGain(); }
    };
    setSoundOn(false);
    playSfx('move');
    expect(started).toBe(0);
    setSoundOn(true);
  });
});
