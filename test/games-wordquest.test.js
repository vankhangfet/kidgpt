import { describe, it, expect } from 'vitest';
import { WQ_SENTENCES, DETECTIVE_CASES } from '../public/games/content.js';
import { shuffleWords, sentencesInZone, firstWrongSlot } from '../public/games/wordquest.js';

describe('word quest content', () => {
  it('has 20 sentences: 4 per zone, 5 zones, all bilingual', () => {
    expect(WQ_SENTENCES).toHaveLength(20);
    for (let z = 1; z <= 5; z++) {
      const inZone = WQ_SENTENCES.filter((s) => s.zone === z);
      expect(inZone).toHaveLength(4);
      for (const s of inZone) {
        expect(Array.isArray(s.words)).toBe(true);
        expect(s.words.length).toBeGreaterThanOrEqual(3);
        expect(s.words.length).toBeLessThanOrEqual(7);
        expect(typeof s.vi).toBe('string');
        expect(typeof s.en).toBe('string');
      }
    }
  });

  it('zone 1 sentences have 3 words, zone 5 have 7', () => {
    expect(WQ_SENTENCES.filter((s) => s.zone === 1).every((s) => s.words.length === 3)).toBe(true);
    expect(WQ_SENTENCES.filter((s) => s.zone === 5).every((s) => s.words.length === 7)).toBe(true);
  });

  it('sentencesInZone returns the 4 sentences of a zone in order', () => {
    const z3 = sentencesInZone(3);
    expect(z3).toHaveLength(4);
    expect(z3.every((s) => s.zone === 3)).toBe(true);
  });
});

describe('shuffleWords', () => {
  it('never returns the original order (>= 2 words)', () => {
    for (let i = 0; i < 100; i++) {
      expect(shuffleWords(['The', 'dog', 'runs'])).not.toEqual(['The', 'dog', 'runs']);
      expect(shuffleWords(['a', 'b'])).not.toEqual(['a', 'b']);
    }
  });

  it('keeps the same multiset of words', () => {
    const words = ['We', 'go', 'to', 'school', 'today'];
    const out = shuffleWords(words);
    expect(out.slice().sort()).toEqual(words.slice().sort());
  });

  it('does not mutate input', () => {
    const words = ['a', 'b', 'c'];
    shuffleWords(words);
    expect(words).toEqual(['a', 'b', 'c']);
  });

  it('firstWrongSlot finds the first mismatch and -1 when correct', () => {
    expect(firstWrongSlot(['The', 'dog'], ['The', 'cat'])).toBe(1);
    expect(firstWrongSlot([null, 'b'], ['a', 'b'])).toBe(0);
    expect(firstWrongSlot(['a', 'b'], ['a', 'b'])).toBe(-1);
  });
});

describe('detective content shape', () => {
  it('has 3 consistent cases', () => {
    expect(DETECTIVE_CASES).toHaveLength(3);
    for (const c of DETECTIVE_CASES) {
      expect(c.suspects).toHaveLength(3);
      expect(c.clues.length).toBeGreaterThanOrEqual(3);
      expect(c.culprit).toBeGreaterThanOrEqual(0);
      expect(c.culprit).toBeLessThan(c.suspects.length);
      expect(c.steps.length).toBeGreaterThanOrEqual(2);
      for (const st of c.steps) {
        const correct = st.options.filter((o) => o.correct).length;
        expect(correct).toBe(1);
        expect(st.options.length).toBeGreaterThanOrEqual(2);
      }
      // bilingual integrity
      for (const key of ['title', 'intro', 'nudge', 'closing']) {
        expect(typeof c[key].vi).toBe('string');
        expect(c[key].vi.length).toBeGreaterThan(3);
        expect(typeof c[key].en).toBe('string');
        expect(c[key].en.length).toBeGreaterThan(3);
      }
      for (const cl of c.clues) {
        expect(cl.who).toBeGreaterThanOrEqual(0);
        expect(cl.who).toBeLessThan(c.suspects.length);
        expect(cl.text.vi.length).toBeGreaterThan(3);
        expect(cl.text.en.length).toBeGreaterThan(3);
      }
      for (const st of c.steps) {
        expect(st.q.vi.length).toBeGreaterThan(3);
        expect(st.q.en.length).toBeGreaterThan(3);
        expect(st.hint.vi.length).toBeGreaterThan(3);
        expect(st.hint.en.length).toBeGreaterThan(3);
        for (const o of st.options) {
          expect(o.text.vi.length).toBeGreaterThan(0);
          expect(o.text.en.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('culprit is logically consistent with clue facts (cookie case: witness contradiction)', () => {
    const cookie = DETECTIVE_CASES.find((c) => c.id === 'cookie');
    expect(cookie.culprit).toBe(2);
    expect(cookie.clues.some((cl) => cl.who === 1)).toBe(true);
    expect(cookie.clues.some((cl) => cl.who === 2)).toBe(true);
  });
});
