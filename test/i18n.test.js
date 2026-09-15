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
  it('placeholder + suggests exist for every subject', () => {
    for (const s of SUBJECTS) {
      expect(placeholderFor('vi', s).length).toBeGreaterThan(5);
      expect(suggestsFor('en', s).length).toBe(3);
    }
  });
});
