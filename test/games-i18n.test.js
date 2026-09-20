import { describe, it, expect } from 'vitest';
import { t, SUBJECTS } from '../public/i18n.js';

const SHARED = [
  'gamesLabel', 'gamesSay', 'gameGo', 'gameBack', 'gameBackChat', 'gameReset', 'gemsLabel',
  'wqCast', 'dgCase', 'dgAccuse', 'dgNextCase',
  'chIntro', 'chNewGame', 'chUndo', 'chHint', 'chCheck', 'chCapture', 'chAte',
  'chWin', 'chLose', 'chDraw', 'chStats',
  'chThinking', 'chYourTurn', 'chYouTook', 'chBotTook', 'soundOn', 'soundOff',
];

describe('games i18n keys', () => {
  it('has shared game ui strings in both languages', () => {
    for (const key of SHARED) {
      expect(typeof t('vi', key)).toBe('string');
      expect(typeof t('en', key)).toBe('string');
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
