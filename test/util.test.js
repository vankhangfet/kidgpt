import { describe, it, expect } from 'vitest';
import { esc, checkAnswer } from '../public/util.js';

describe('esc', () => {
  it('escapes html special chars', () => {
    expect(esc('<b>"a"&\'</b>')).toBe('&lt;b&gt;&quot;a&quot;&amp;&#39;&lt;/b&gt;');
  });
});

describe('checkAnswer', () => {
  it('matches number embedded in a sentence (vi)', () => {
    expect(checkAnswer('Ket qua la 35 a!', 35)).toBe(true);
  });
  it('rejects wrong number', () => {
    expect(checkAnswer('42', 35)).toBe(false);
  });
  it('matches decimal with comma', () => {
    expect(checkAnswer('2,5', 2.5)).toBe(true);
  });
  it('matches string ignoring case, spaces, hyphens, diacritics', () => {
    expect(checkAnswer('Thirty  Five', 'thirty-five')).toBe(true);
    expect(checkAnswer('xin chao', 'xin chào')).toBe(true);
  });
  it('returns false for null check or no number in answer', () => {
    expect(checkAnswer('khong biet', 35)).toBe(false);
    expect(checkAnswer('35', null)).toBe(false);
  });
});
