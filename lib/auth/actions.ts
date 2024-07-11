"use server";

import { lucia } from "@/lib/auth";
import { Session, User } from "lucia";
import { cookies } from "next/headers";
import { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/lib/db/schema";

export async function auth(): Promise<
  { user: User; session: Session } | { user: null; session: null }
> {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);
  const { user, session } = result;

  try {
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
  } catch (error) {
    console.error("Expected error setting cookies");
    // Next.js throws error when attempting to set cookies when rendering page
  }
  return result;
}

export async function upsertUser(
  db: NeonDatabase<typeof schema>,
  args: {
    userId: string;
    displayName: string;
    email: string;
    firstName: string;
    lastName: string;
    stripeCustomerId: string;
    providerName: "google" | "github";
    providerUserId: string;
  },
): Promise<{ userId: string; pushTo: string }> {
  const {
    userId,
    displayName,
    email,
    firstName,
    lastName,
    stripeCustomerId,
    providerName,
    providerUserId,
  } = args;

  await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(schema.user)
      .values({
        id: userId,
        displayName,
        email,
        firstName,
        lastName,
        isAdmin: false,
        stripeCustomerId,
      })
      .returning({ id: schema.user.id });
    await tx.insert(schema.oauthAccount).values({
      providerName,
      providerUserId,
      userId,
    });
  });

  return { userId, pushTo: `/new` };
}
