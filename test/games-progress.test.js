import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, clearProgress } from '../public/games/progress.js';

describe('game progress storage', () => {
  const store = new Map();
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  });

  it('returns null when nothing saved', () => {
    expect(loadProgress('p1', 'chess')).toBeNull();
  });

  it('saves and loads json per profile+game', () => {
    saveProgress('p1', 'chess', { won: 1, lost: 2 });
    expect(loadProgress('p1', 'chess')).toEqual({ won: 1, lost: 2 });
    expect(loadProgress('p2', 'chess')).toBeNull();
    expect(loadProgress('p1', 'treasure')).toBeNull();
  });

  it('clears saved progress', () => {
    saveProgress('p1', 'chess', { won: 1 });
    clearProgress('p1', 'chess');
    expect(loadProgress('p1', 'chess')).toBeNull();
  });

  it('falls back to in-memory when localStorage throws (private mode)', () => {
    globalThis.localStorage = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    saveProgress('p1', 'chess', { won: 3 });
    expect(loadProgress('p1', 'chess')).toEqual({ won: 3 });
    clearProgress('p1', 'chess');
    expect(loadProgress('p1', 'chess')).toBeNull();
  });
});
