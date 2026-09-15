import { describe, it, expect, vi, afterEach } from 'vitest';
import { logLine } from '../api/lib/log.js';

afterEach(() => vi.restoreAllMocks());

describe('logLine', () => {
  it('emits one valid JSON line with ts and event', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logLine('chat', { lang: 'vi', outcome: 'plan' });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(spy.mock.calls[0][0]);
    expect(line.event).toBe('chat');
    expect(line.lang).toBe('vi');
    expect(typeof line.ts).toBe('string');
  });
  it('never throws on non-serializable fields', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => logLine('x', { bad: BigInt(1) })).not.toThrow();
    spy.mockRestore();
  });
});
