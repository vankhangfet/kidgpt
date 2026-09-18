import { describe, it, expect } from 'vitest';
import { TREASURE_LEVELS, makeQuestion, makeOptions, hintFor } from '../public/games/treasure.js';

describe('treasure question generator', () => {
  it('has 3 levels, lv3 has all 4 ops', () => {
    expect(TREASURE_LEVELS).toHaveLength(3);
    expect(TREASURE_LEVELS[2].ops).toEqual(expect.arrayContaining(['add', 'sub', 'mul', 'div']));
  });

  it('level 1 stays within 0..20', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(1);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(20);
    }
  });

  it('level 2 stays within 0..100', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(100);
    }
  });

  it('level 3 division is exact, multiplication = a*b', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(3);
      if (q.op === 'div') expect(q.a % q.b).toBe(0);
      if (q.op === 'mul') expect(q.answer).toBe(q.a * q.b);
    }
  });

  it('every question has exactly 3 distinct options including the answer, all >= 0', () => {
    for (let lv = 1; lv <= 3; lv++) {
      for (let i = 0; i < 100; i++) {
        const q = makeQuestion(lv);
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options).toContain(q.answer);
        for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('makeOptions builds distractors without the answer duplicated', () => {
    const opts = makeOptions(12, 'sub', 20, 8);
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts).toContain(12);
  });

  it('hintFor fills operands for both langs and steps', () => {
    const q = { op: 'add', a: 6, b: 6, answer: 12 };
    expect(hintFor(q, 0, 'vi')).toContain('6');
    expect(hintFor(q, 1, 'en')).toContain('6');
  });
});
