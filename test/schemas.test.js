import { describe, it, expect } from 'vitest';
import {
  validatePlan, validateJudge, sanitizeText, sanitizeHistory, SUBJECTS,
  AGE_BANDS, sanitizeProfileName, normalizeAgeBand,
} from '../api/lib/schemas.js';

const validPlan = {
  type: 'plan',
  subject: 'math',
  intro: 'Cùng giải nhé!',
  aid: { type: 'number-blocks', numbers: [25, 17], operation: 'add' },
  steps: [
    { question: 'Tách 17 thành 10 + 7 nhé?', tip: 'Tách hàng chục trước.', check: null },
    { question: '25 + 10 bằng bao nhiêu?', tip: 'Cộng hàng chục.', check: 35 },
  ],
  answer: { value: '42', explanation: '25+10=35, 35+7=42', celebration: 'Giỏi lắm!' },
};

describe('validatePlan', () => {
  it('accepts a valid plan', () => {
    const r = validatePlan(validPlan);
    expect(r.ok).toBe(true);
  });
  it('accepts refusal', () => {
    const r = validatePlan({ type: 'refusal', message: 'Mình chỉ giúp bài học nhé!' });
    expect(r.ok).toBe(true);
  });
  it('rejects unknown subject / aid type', () => {
    expect(validatePlan({ ...validPlan, subject: 'sports' }).ok).toBe(false);
    expect(validatePlan({ ...validPlan, aid: { type: 'svg', html: '<script/>' } }).ok).toBe(false);
  });
  it('rejects plans with 1 or 5 steps', () => {
    expect(validatePlan({ ...validPlan, steps: validPlan.steps.slice(0, 1) }).ok).toBe(false);
    expect(validatePlan({ ...validPlan, steps: [...validPlan.steps, ...validPlan.steps, ...validPlan.steps] }).ok).toBe(false);
  });
  it('rejects missing answer', () => {
    const bad = { ...validPlan };
    delete bad.answer;
    expect(validatePlan(bad).ok).toBe(false);
  });
  it('rejects number-blocks above 999', () => {
    expect(validatePlan({ ...validPlan, aid: { type: 'number-blocks', numbers: [1000, 5], operation: 'add' } }).ok).toBe(false);
  });
  it('accepts all four aid types', () => {
    const aids = [
      { type: 'group-dots', groups: 3, perGroup: 4 },
      { type: 'letter-tiles', word: 'rabbit' },
      { type: 'step-flow', steps: [{ icon: 'sun', label: 'Nắng' }, { icon: 'cloud', label: 'Mây' }] },
      null,
    ];
    for (const aid of aids) expect(validatePlan({ ...validPlan, aid }).ok).toBe(true);
  });
});

describe('validateJudge', () => {
  it('accepts all verdicts', () => {
    for (const verdict of ['correct', 'close', 'incorrect', 'new_question']) {
      expect(validateJudge({ verdict, feedback: 'ok', praise: 'nice' }).ok).toBe(true);
    }
  });
  it('rejects unknown verdict', () => {
    expect(validateJudge({ verdict: 'maybe', feedback: '', praise: '' }).ok).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('strips html, collapses whitespace, truncates to 500', () => {
    expect(sanitizeText('  <b>hi</b>   there ')).toBe('hi there');
    expect(sanitizeText('x'.repeat(600)).length).toBe(500);
    expect(sanitizeText(null)).toBe('');
  });
  it('preserves math comparison operators', () => {
    expect(sanitizeText('so sanh 2 < 4 va 5 > 1')).toBe('so sanh 2 < 4 va 5 > 1');
  });
  it('strips tag-shaped runs only', () => {
    expect(sanitizeText('a <img src=x> b')).toBe('a b');
    expect(sanitizeText('<b>bold</b> text')).toBe('bold text');
  });
  it('caps input before regex — no ReDoS on long angle-bracket runs', () => {
    const start = Date.now();
    const out = sanitizeText('<'.repeat(100000));
    expect(Date.now() - start).toBeLessThan(1000);
    expect(out.length).toBeLessThanOrEqual(500);
  });
});

describe('sanitizeHistory', () => {
  it('keeps last 10 valid entries only', () => {
    const items = [];
    for (let i = 0; i < 14; i++) items.push({ role: 'user', content: 'q' + i });
    const out = sanitizeHistory([...items, { role: 'system', content: 'hack' }, null, { role: 'user', content: '   ' }]);
    expect(out.length).toBe(10);
    expect(out[9].content).toBe('q13');
  });
  it('returns [] for non-array', () => {
    expect(sanitizeHistory('nope')).toEqual([]);
  });
});

describe('SUBJECTS', () => {
  it('has 5 subjects', () => {
    expect(SUBJECTS).toEqual(['math', 'reading', 'english', 'science', 'curio']);
  });
});

describe('profile helpers', () => {
  it('AGE_BANDS has two bands', () => {
    expect(AGE_BANDS).toEqual(['6-8', '9-12']);
  });
  it('sanitizeProfileName strips html and caps at 20', () => {
    expect(sanitizeProfileName('  <b>Bé</b> Bi ')).toBe('Bé Bi');
    expect(sanitizeProfileName('x'.repeat(40)).length).toBe(20);
    expect(sanitizeProfileName(null)).toBe('');
  });
  it('normalizeAgeBand accepts known bands only', () => {
    expect(normalizeAgeBand('6-8')).toBe('6-8');
    expect(normalizeAgeBand('9-12')).toBe('9-12');
    expect(normalizeAgeBand('3-5')).toBeNull();
    expect(normalizeAgeBand(undefined)).toBeNull();
  });
});
