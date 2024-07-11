import { z } from "zod";
import { schema } from "@/lib/db";
import { createSelectSchema } from "drizzle-zod";

export const gameSetup = z.object({
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

export const game = createSelectSchema(schema.game)
export const play = createSelectSchema(schema.play)
export const query = createSelectSchema(schema.query)
export const submission = createSelectSchema(schema.submission)
export const user = createSelectSchema(schema.user)
export const publicUser = user.pick({
  id: true,
  displayName: true,
})

export const problem = game.extend({
  sequence,
  play: play.extend({ 
    submission: submission.nullable(),
    queries: query.array(),
  }).nullable()
})

export type Position = z.infer<typeof position>;
export type Sequence = z.infer<typeof sequence>;
export type RawProblem = z.infer<typeof gameSetup>;
export type Problem = z.infer<typeof problem>;
