import { describe, it, expect } from 'vitest';
import { t, SUBJECTS, resolveLang } from '../public/i18n.js';

const SHARED = [
  'gamesLabel', 'gamesSay', 'gameGo', 'gameBack', 'gameBackChat', 'gameReset', 'gemsLabel',
  'wqCast', 'dgCase', 'dgAccuse', 'dgNextCase',
  'chIntro', 'chNewGame', 'chUndo', 'chHint', 'chCheck', 'chCapture', 'chAte',
  'chWin', 'chLose', 'chDraw', 'chStats',
  'signInEyebrow', 'signInH1', 'signInLede', 'trustSafe', 'trustParent', 'trustPrivate', 'signInConnecting', 'signInSafe', 'benefit1T', 'benefit1D', 'benefit2T', 'benefit2D', 'benefit3T', 'benefit3D', 'gateFoot',
  'chThinking', 'chYourTurn', 'chYouTook', 'chBotTook', 'soundOn', 'soundOff',
];

describe('games i18n keys', () => {
  it('has shared game ui strings in both languages', () => {
    for (const key of SHARED) {
      expect(t('vi', key)).toBeTruthy();
      expect(t('en', key)).toBeTruthy();
    }
    for (let i = 1; i <= 3; i++) {
      expect(t('vi', 'trLv' + i)).toBeTruthy();
      expect(t('en', 'trLv' + i)).toBeTruthy();
    }
    for (let i = 1; i <= 5; i++) {
      expect(t('vi', 'trNode' + i)).toBeTruthy();
      expect(t('en', 'trNode' + i)).toBeTruthy();
      expect(t('vi', 'wqZone' + i)).toBeTruthy();
      expect(t('en', 'wqZone' + i)).toBeTruthy();
    }
  });
  it('keeps games out of chat subjects (api contract)', () => {
    expect(SUBJECTS).not.toContain('games');
  });
});

describe('resolveLang', () => {
  it('defaults to english for missing or unknown values', () => {
    expect(resolveLang(null)).toBe('en');
    expect(resolveLang(undefined)).toBe('en');
    expect(resolveLang('fr')).toBe('en');
    expect(resolveLang('')).toBe('en');
  });
  it('keeps a stored vi or en', () => {
    expect(resolveLang('vi')).toBe('vi');
    expect(resolveLang('en')).toBe('en');
  });
});
