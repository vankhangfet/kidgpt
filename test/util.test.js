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
  it('matches answer among multiple numbers in a full equation', () => {
    expect(checkAnswer('25 + 10 = 35', 35)).toBe(true);
    expect(checkAnswer('17 tach thanh 10 va 7', 7)).toBe(true);
  });
  it('handles vietnamese thousands dots without false positive', () => {
    expect(checkAnswer('1.000', 1000)).toBe(true);
    expect(checkAnswer('1.000', 1)).toBe(false);
  });
  it('handles unicode minus sign U+2212', () => {
    expect(checkAnswer('kết quả là −5', -5)).toBe(true);
  });
  it('handles check value 0', () => {
    expect(checkAnswer('kết quả là 0', 0)).toBe(true);
    expect(checkAnswer('không có số nào', 0)).toBe(false);
  });
});
