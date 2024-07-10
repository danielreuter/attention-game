import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { google, lucia, upsertUser } from "@/lib/auth";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { createPooledConnection } from "@/lib/db/pool";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET(request: Request): Promise<Response> {
  const { db, pool } = createPooledConnection();
  await pool.connect();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const storedState = cookies().get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier =
    cookies().get("google_oauth_code_verifier")?.value ?? null;

  if (
    !code ||
    !state ||
    !storedCodeVerifier ||
    !storedState ||
    state !== storedState
  ) {
    return new Response(null, {
      status: 400,
    });
  }
  revalidateTag("auth");
  revalidatePath("/");

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );
    const googleUser: GoogleUser = await response.json();

    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, googleUser.email),
    });

    if (existingUser) {
      // Try to upsert the github OAuth
      await db
        .insert(schema.oauthAccount)
        .values({
          providerName: "google",
          providerUserId: googleUser.sub,
          userId: existingUser.id,
        })
        .onConflictDoNothing()
        .execute();

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    const userId = generateId(15);

    // const stripeCustomerId = await createCustomerId(userId, googleUser.email);
    const stripeCustomerId = crypto.randomUUID();

    const { pushTo } = await upsertUser(db, {
      userId,
      displayName: googleUser.email.split("@")[0],
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      stripeCustomerId,
      providerName: "google",
      providerUserId: googleUser.sub,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    // the specific error message depends on the provider
    if (e instanceof OAuth2RequestError) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}

interface GoogleUser {
  sub: string; // The user's unique Google ID.
  email: string; // The user's email address.
  verified_email: boolean; // Whether the email is verified.
  name: string; // The user's full name.
  given_name: string; // The user's given (first) name.
  family_name: string; // The user's family (last) name.
  picture: string; // The URL of the user's profile picture.
  locale: string; // The user's locale (e.g., "en").
}
