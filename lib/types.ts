import { z } from "zod";

export const rawProblem = z.object({
  subject: z.string().describe("The subject of the sentence"),
  sentence: z.string().describe("The sentence"),
});

export const position = z.object({
  value: z.string().describe("The true value"),
  guess: z.string().describe("The user's guess"),
  isGiven: z.boolean().describe("Is this position given?"),
  currentAttention: z.number().optional().describe("Current attention value"),
});

export const sequence = position.array();

export const problem = rawProblem.extend({ sequence });

export type Position = z.infer<typeof position>;
export type Sequence = z.infer<typeof sequence>;
export type RawProblem = z.infer<typeof rawProblem>;
export type Problem = z.infer<typeof problem>;
