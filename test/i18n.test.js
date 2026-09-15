import { describe, it, expect } from 'vitest';
import {
  t, SUBJECTS, subjectLabel, placeholderFor, suggestsFor, STRINGS,
} from '../public/i18n.js';

describe('key parity', () => {
  it('vi and en have identical key sets', () => {
    expect(Object.keys(STRINGS.vi).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });
  it('fallback plans have same step count', () => {
    expect(STRINGS.vi.fallbackPlan.steps.length).toBe(STRINGS.en.fallbackPlan.steps.length);
  });
});

describe('t()', () => {
  it('looks up per lang', () => {
    expect(t('vi', 'startOver')).toBe('Bắt đầu lại');
    expect(typeof t('en', 'startOver')).toBe('string');
  });
});

describe('subjects', () => {
  it('labels every subject in both langs', () => {
    for (const s of SUBJECTS) {
      expect(typeof subjectLabel('vi', s)).toBe('string');
      expect(typeof subjectLabel('en', s)).toBe('string');
    }
  });
  it('placeholder + suggests exist for every subject in both langs', () => {
    for (const s of SUBJECTS) {
      for (const lang of ['vi', 'en']) {
        expect(placeholderFor(lang, s).length).toBeGreaterThan(5);
        expect(suggestsFor(lang, s).length).toBe(3);
      }
    }
  });
  it('fallbackPlan nested keys have parity', () => {
    expect(Object.keys(STRINGS.vi.fallbackPlan).sort()).toEqual(Object.keys(STRINGS.en.fallbackPlan).sort());
    STRINGS.vi.fallbackPlan.steps.forEach((s, i) => {
      expect(Object.keys(s).sort()).toEqual(['question', 'tip']);
      expect(Object.keys(STRINGS.en.fallbackPlan.steps[i]).sort()).toEqual(['question', 'tip']);
    });
  });
  it('cheers have 4 variants in both langs', () => {
    expect(STRINGS.vi.cheers.length).toBe(4);
    expect(STRINGS.en.cheers.length).toBe(4);
  });
  it('welcomeBody contains strong in both langs, no other string contains markup', () => {
    expect(STRINGS.vi.welcomeBody).toMatch(/<strong>.*<\/strong>/);
    expect(STRINGS.en.welcomeBody).toMatch(/<strong>.*<\/strong>/);
    function scan(obj, path) {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          if (k !== 'welcomeBody') expect(`${path}.${k}`).not.toContain('<');
        } else if (v && typeof v === 'object') scan(v, `${path}.${k}`);
      }
    }
    scan(STRINGS.vi, 'vi');
    scan(STRINGS.en, 'en');
  });
  it('t() falls back to vi for unknown lang', () => {
    expect(t('xx', 'startOver')).toBe('Bắt đầu lại');
    expect(subjectLabel('xx', 'math')).toBe('Toán');
  });
});
