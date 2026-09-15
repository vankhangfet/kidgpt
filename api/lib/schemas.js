import { z } from 'zod';

export const SUBJECTS = ['math', 'reading', 'english', 'science', 'curio'];
export const AID_ICONS = ['sun', 'cloud', 'rain', 'drop', 'seed', 'sprout', 'arrow', 'question', 'moon', 'star'];

const numberBlocks = z.object({
  type: z.literal('number-blocks'),
  numbers: z.tuple([z.number().int().min(0).max(9999), z.number().int().min(0).max(9999)]),
  operation: z.enum(['add', 'sub']),
});

const groupDots = z.object({
  type: z.literal('group-dots'),
  groups: z.number().int().min(1).max(12),
  perGroup: z.number().int().min(1).max(12),
});

const letterTiles = z.object({
  type: z.literal('letter-tiles'),
  word: z.string().min(1).max(24),
});

const stepFlow = z.object({
  type: z.literal('step-flow'),
  steps: z.array(z.object({
    icon: z.enum(AID_ICONS),
    label: z.string().min(1).max(40),
  })).min(1).max(6),
});

export const aidSchema = z.discriminatedUnion('type', [numberBlocks, groupDots, letterTiles, stepFlow]);

const stepSchema = z.object({
  question: z.string().min(1).max(500),
  tip: z.string().min(1).max(300),
  check: z.union([z.number(), z.string().max(100), z.null()]).optional(),
});

const planContent = z.object({
  type: z.literal('plan'),
  subject: z.enum(SUBJECTS),
  intro: z.string().min(1).max(500),
  aid: aidSchema.nullable(),
  steps: z.array(stepSchema).min(2).max(4),
  answer: z.object({
    value: z.string().min(1).max(100),
    explanation: z.string().min(1).max(1000),
    celebration: z.string().min(1).max(300),
  }),
});

const refusalContent = z.object({
  type: z.literal('refusal'),
  message: z.string().min(1).max(500),
});

export const planSchema = z.discriminatedUnion('type', [planContent, refusalContent]);

export const judgeSchema = z.object({
  verdict: z.enum(['correct', 'close', 'incorrect', 'new_question']),
  feedback: z.string().max(500),
  praise: z.string().max(300),
});

export function validatePlan(data) {
  const result = planSchema.safeParse(data);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error.message };
}

export function validateJudge(data) {
  const result = judgeSchema.safeParse(data);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error.message };
}

export function sanitizeText(text, maxLen = 500) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeHistory(history, max = 10) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant')
      && typeof m.content === 'string' && m.content.trim())
    .slice(-max)
    .map((m) => ({ role: m.role, content: sanitizeText(m.content) }));
}
