"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createServerAction, createServerActionProcedure } from "zsa";
import { extractSequence } from "../utils";
import { revalidatePath, unstable_noStore } from "next/cache";
import { Position, Sequence, problem, gameSetup, sequence } from "@/lib/types";
import { auth } from "../auth";
import { db, schema } from "../db";
import { eq, gt, sql } from "drizzle-orm";

const action = createServerActionProcedure()
  .handler(auth)

const protectedAction = createServerActionProcedure(action)
  .handler(async ({ ctx }) => {
    if (ctx.user) return ctx;
    throw new Error("Not logged in");
  })

const adminAction = createServerActionProcedure(protectedAction)
  .handler(async ({ ctx }) => {
    if (ctx.user.isAdmin) return ctx;
    throw new Error("Not an admin");
  })

export const getAllGames = action
  .createServerAction()
  .handler(async () => {
    return db.query.game.findMany();
  });

export const createGame = action // todo: make this admin
  .createServerAction()
  .input(gameSetup)
  .handler(async ({ input }) => {
    const game = await db
      .insert(schema.game)
      .values(input);
    revalidatePath("/create-game");
    return game;
  });




export const getProblem = action
  .createServerAction()
  .input(z.void())
  .output(problem)
  .handler(async ({ ctx: { user }}) => {
    const response = await db.query.daily.findFirst({
      where: sql`date = CURRENT_DATE`,
      with: {
        game: {
          with: {
            plays: {
              where: eq(schema.play.userId, user?.id ?? ""),
              limit: 1, // should be one or zero
              with: {
                submission: true,
                queries: true,
              }
            }
          }
        }
      }
    })

    if (response) {
      return {
        ...response.game,
        sequence: extractSequence(response.game.sentence),
        play: response.game.plays[0] ?? null,
      }
    }

    // make new daily, attaching a fresh game
    const allDailies = await db.query.daily.findMany({
      with: { game: true }
    });

    const highestId = allDailies.reduce((maxId, { game }) => {
      return game.id > maxId ? game.id : maxId;
    }, -1);

    const newGame = await db.query.game.findFirst({
      where: gt(schema.game.id, highestId),
    })

    if (!newGame) throw new Error("Ran out of games")

    await db
      .insert(schema.daily)
      .values({
        gameId: newGame.id,
      })

    return {
      ...newGame,
      sequence: extractSequence(newGame.sentence),
      play: null,
    }
  });





export const runQuery = createServerAction()
  .input(
    z.object({
      query: z.string(),
      sequence,
    }),
  )
  .output(sequence)
  .handler(async ({ input: { query, sequence } }) => {
    unstable_noStore();
    const { text, usage } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      // model: openai("gpt-4o"),
      system: `
        You are playing a game with a user, giving them clues to help them guess \
        a sequence of words. 

        This is the sequence:
        ${sequence
          .map((element, i) => {
            return `${i}. \n${element.value}`;
          })
          .join("\n")}

        The user has a scratchpad where they write down their notes \
        at each position. Each turn, they will show you their scratchpad (some positions \
        might be [blank]) as well as a query. Your job is to respond to this query from \
        the perspective of each position, providing a score with the following rubric:

        -5 = absolutely not
        -4 = hell no
        -3 = no
        -2 = I'd say no
        -1 = vaguely no
        0 = neutral/unsure/ambiguous
        1 = ever so slightly yes
        2 = I'd say yes
        3 = yes
        4 = hell yes
        5 = absolutely yes
        
        For example, they might ask "am I a noun?" or "am I right?" or "am I distinctive?" \
        Some of these questions are just related to the underlying word, while some rely on the relation \
        between the user's notes and the underlying word. Make sure to take this into account. 

        Remember that the user is asking questions from the perspective of the *underlying word* -- the scratchpad \
        just tells you what they currently think about each word.

        Make sure to use the intermediate scores when doing so provides helpful information for the user.
      `,
      prompt: `
        Here is my scratchpad:
        ${sequence
          .map((element, i) => {
            return `${i}. ${element.guess ? element.guess : "[blank]"}`;
          })
          .join("\n")}
        
        Here is my query: ${query}

        Please write your scores in the following format:

        {position}. {reasoning: 10-30 words interpreting the query from the perspective of that position in light of the scratchpad entry as well as the ground-truth, you can write whatever here, I won't look at it}. Score: {score}

        Example: 

        query: "am I on the right track?"
        0. The user thinks this is "why" when really it is "when," which is very close but semantically quite different. Score: 3. 
        1. The user thinks this is a noun larger than a city and appears to have guessed "planets", and this seems vaguely on the right track towards the right answer of "continents." Score: 3
        2. The user thinks this is "a verb or something like build", which is correct insofar as the right answer, "drift" is a verb, but "build" is way off. Score 1.
        3. The user has left this "[blank]", so that is as wrong as you can be. Score: -5. 
        4. The user has left a note that this might be "the? [article]" but the correct word is not an article, so this is completely off. Score: -5. 
        ... etc
        `,
    });

    console.log(text);

    const parsedScores = parseAIScores(text, sequence.length);

    console.log("Parsed Scores:", parsedScores);

    console.log("our usage", usage);
    return sequence.map((element, i) => {
      const attentionValue = parsedScores[i];
      if (attentionValue === undefined) {
        throw new Error("Missing attention value");
      }
      return {
        ...element,
        currentAttention: attentionValue,
      };
    });
  });

function parseAIScores(response: string, length: number): number[] {
  const scores = new Array(length).fill(0);
  const regex = /(\d+)\.\s.*?Score:\s*(-?\d+)/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    const position = parseInt(match[1], 10);
    let score = parseInt(match[2], 10);

    if (position >= length || isNaN(score)) {
      console.error("Invalid score or position in AI response");
    }

    score = Math.max(-5, Math.min(5, score));
    scores[position] = score;
  }

  return scores;
}

export const runSubmission = createServerAction()
  .input(
    z.object({
      submission: z.string(),
      problem,
    }),
  )
  .handler(async ({ input: { submission, problem } }) => {
    console.log("checking submission")
    const { object } = await generateObject({
      model: anthropic("claude-3-5-sonnet-20240620"),
      schema: z.object({
        isCorrect: z.boolean().describe("Whether the submission is correct"),
      }),
      prompt: `Your job is to decide whether a user has accurately guessed a (hidden) ground-truth sentence. \
        You should be about as permissive as a college professor--slight spelling mistakes \
        or minor deviations from the correct answer should be accepted as long as they obviously reflect the same underlying \
        thing. 

        The ground-truth sentence is: ${problem.sentence}
        The submission is: ${submission}
      `,
    });
    console.log("made submissiont thing", object)
    return object;
  });