import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt, buildJudgePrompt, buildChatMessages, buildJudgeMessages, CORRECTION_MESSAGE,
} from '../api/lib/prompts.js';

describe('buildSystemPrompt', () => {
  it('returns vi prompt with pedagogy rules for vi', () => {
    const p = buildSystemPrompt('vi');
    expect(p).toContain('Socratic');
    expect(p).toContain('number-blocks');
    expect(p).toContain('refusal');
  });
  it('returns en prompt for en', () => {
    const p = buildSystemPrompt('en');
    expect(p).toContain('Socratic');
    expect(p).toContain('group-dots');
  });
});

describe('buildJudgePrompt', () => {
  it('mentions all four verdicts and no-answer rule', () => {
    for (const lang of ['vi', 'en']) {
      const p = buildJudgePrompt(lang);
      expect(p).toContain('correct');
      expect(p).toContain('close');
      expect(p).toContain('incorrect');
      expect(p).toContain('new_question');
    }
  });
});

describe('buildChatMessages', () => {
  it('places system first, history middle, user last', () => {
    const msgs = buildChatMessages({
      message: '25 + 17?',
      history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'chào bạn' }],
      subject: null,
      lang: 'vi',
    });
    expect(msgs[0].role).toBe('system');
    expect(msgs[1]).toEqual({ role: 'user', content: 'hi' });
    expect(msgs[2]).toEqual({ role: 'assistant', content: 'chào bạn' });
    expect(msgs[3]).toEqual({ role: 'user', content: '25 + 17?' });
  });
  it('appends subject hint when subject given', () => {
    const msgs = buildChatMessages({ message: 'q', history: [], subject: 'math', lang: 'vi' });
    expect(msgs.at(-1).content).toContain('math');
  });
});

describe('buildJudgeMessages', () => {
  it('user message carries question, stepQuestion, childAnswer as JSON', () => {
    const msgs = buildJudgeMessages({ question: 'Q', stepQuestion: 'S', childAnswer: 'A', lang: 'vi' });
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
    expect(JSON.parse(msgs[1].content)).toEqual({ question: 'Q', stepQuestion: 'S', childAnswer: 'A' });
  });
});

describe('CORRECTION_MESSAGE', () => {
  it('is a non-empty string', () => {
    expect(typeof CORRECTION_MESSAGE).toBe('string');
    expect(CORRECTION_MESSAGE.length).toBeGreaterThan(10);
  });
});
