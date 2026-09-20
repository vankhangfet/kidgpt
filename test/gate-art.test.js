import { describe, it, expect } from 'vitest';
import {
  starSvg, cloudSvg, HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD,
  BUDDY_ROBOT, BUDDY_OWL, GOOGLE_ICON, SPINNER, BRAND_MARK,
  ICON_SHIELD, ICON_CHECK, ICON_LOCK, ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM,
} from '../public/gate-art.js';

describe('gate art', () => {
  it('scene helpers embed class and viewBox', () => {
    expect(starSvg('s2')).toContain('g-star s2');
    expect(starSvg('s2')).toContain('viewBox="0 0 24 24"');
    expect(cloudSvg('c1')).toContain('g-cloud c1');
    expect(cloudSvg('c1')).toContain('viewBox="0 0 64 28"');
  });

  it('mascots and icons are non-empty svg strings', () => {
    const all = [HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD, BUDDY_ROBOT, BUDDY_OWL,
      GOOGLE_ICON, SPINNER, BRAND_MARK, ICON_SHIELD, ICON_CHECK, ICON_LOCK,
      ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM];
    for (const s of all) {
      expect(typeof s).toBe('string');
      expect(s.startsWith('<svg')).toBe(true);
      expect(s.length).toBeGreaterThan(40);
      expect(s.endsWith('</svg>')).toBe(true);
    }
  });

  it('sad badge flips the smile', () => {
    expect(HERO_BADGE).toContain('c2.4 3');
    expect(HERO_BADGE_SAD).toContain('c2.4 -3');
  });

  it('mascots carry their animation classes', () => {
    expect(SPARKLE_MASCOT).toContain('class="g-sparkle"');
    expect(HERO_BADGE).toContain('class="g-badge"');
    expect(BUDDY_ROBOT).toContain('b-left');
    expect(BUDDY_OWL).toContain('b-right');
  });
});
