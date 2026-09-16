import { describe, it, expect } from 'vitest';
import { renderAid } from '../public/aids.js';

describe('renderAid', () => {
  it('renders number-blocks with rods/cubes and plus sign', () => {
    const html = renderAid({ type: 'number-blocks', numbers: [25, 17], operation: 'add' }, 'vi');
    expect((html.match(/class="rod"/g) || []).length).toBe(3); // 2 + 1 tens
    expect((html.match(/class="cube"/g) || []).length).toBe(12); // 5 + 7 ones
    expect(html).toContain('plus-sign');
    expect(html).toContain('+');
  });
  it('renders minus sign for sub', () => {
    expect(renderAid({ type: 'number-blocks', numbers: [25, 17], operation: 'sub' }, 'vi')).toContain('−');
  });
  it('renders group-dots with groups x perGroup dots', () => {
    const html = renderAid({ type: 'group-dots', groups: 3, perGroup: 4 }, 'en');
    expect((html.match(/class="dot"/g) || []).length).toBe(12);
    expect((html.match(/class="dot-group"/g) || []).length).toBe(3);
  });
  it('renders letter-tiles with vowels flagged, escaped word', () => {
    const html = renderAid({ type: 'letter-tiles', word: 'cat' }, 'en');
    expect((html.match(/class="tile[ "]/g) || []).length).toBe(3);
    expect(html).toContain('tile vowel');
  });
  it('renders step-flow with icons and labels', () => {
    const html = renderAid({
      type: 'step-flow',
      steps: [
        { icon: 'sun', label: 'Nắng' },
        { icon: 'cloud', label: 'Mây' },
        { icon: 'rain', label: 'Mưa' },
      ],
    }, 'vi');
    expect(html).toContain('flow-step');
    expect(html).toContain('Nắng');
    expect(html).toContain('<svg');
  });
  it('returns empty string for null, unknown type, or bad params', () => {
    expect(renderAid(null, 'vi')).toBe('');
    expect(renderAid({ type: 'svg-raw', html: '<script>' }, 'vi')).toBe('');
    expect(renderAid({ type: 'number-blocks', numbers: [-1, 5], operation: 'add' }, 'vi')).toBe('');
    expect(renderAid({ type: 'letter-tiles', word: '' }, 'vi')).toBe('');
  });
  it('returns empty string for crash-shaped params, not TypeError', () => {
    expect(renderAid({ type: 'number-blocks', numbers: {}, operation: 'add' }, 'vi')).toBe('');
    expect(renderAid({ type: 'step-flow', steps: [null] }, 'vi')).toBe('');
  });
  it('escapes payload words per character', () => {
    const html = renderAid({ type: 'letter-tiles', word: '"><svg/onload=alert(1)>' }, 'en');
    // scope to the tiles region: the aidWrap header legitimately contains
    // a decorative <svg> icon, only the payload must stay escaped
    const tiles = html.slice(html.indexOf('<div class="tiles">'));
    expect(tiles).not.toContain('<svg');
    expect(tiles).toContain('&lt;');
  });
  it('caps step-flow at six steps', () => {
    const steps = [];
    for (let i = 0; i < 8; i++) steps.push({ icon: 'sun', label: 'S' + i });
    const html = renderAid({ type: 'step-flow', steps }, 'vi');
    expect((html.match(/class="flow-step"/g) || []).length).toBe(6);
  });
  it('flags vietnamese vowels including diacritics', () => {
    const html = renderAid({ type: 'letter-tiles', word: 'mèo' }, 'vi');
    expect((html.match(/tile vowel/g) || []).length).toBe(2);
  });
});
