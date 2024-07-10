import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { github, lucia, upsertUser } from "@/lib/auth";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { createPooledConnection } from "@/lib/db/pool";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const { db, pool } = createPooledConnection();
  await pool.connect();

  // console.log("test complete");
  // console.log("1. Starting GitHub OAuth callback processing");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("github_oauth_state")?.value ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    // console.log("2. Missing or mismatched parameters", {
    //   code,
    //   state,
    //   storedState,
    // });
    return new Response(null, {
      status: 400,
    });
  }
  revalidateTag("auth");
  revalidatePath("/");

  try {
    // console.log("3. Validating authorization code", { code });
    const tokens = await github.validateAuthorizationCode(code);
    // console.log("4. Authorization code validated", {
    //   accessToken: tokens.accessToken,
    // });
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();
    // console.log("5. Fetched GitHub user", { githubUser });

    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const emails: {
      email: string;
      primary: boolean;
      verified: boolean;
    }[] = await emailsResponse.json();
    // console.log("6. Fetched GitHub user emails", { emails });
    const primaryEmail = emails.find((email) => email.primary) ?? null;

    if (!primaryEmail) {
      // console.log("7. No primary email address found");
      return new Response("No primary email address", {
        status: 400,
      });
    }
    if (!primaryEmail.verified) {
      // console.log("8. Primary email is unverified", { primaryEmail });
      return new Response("Unverified email", {
        status: 400,
      });
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, primaryEmail.email),
    });

    if (existingUser) {
      // console.log("9. Existing user found", { existingUser });
      // Try to upsert the github OAuth
      await db
        .insert(schema.oauthAccount)
        .values({
          providerName: "github",
          providerUserId: githubUser.id,
          userId: existingUser.id,
        })
        .onConflictDoNothing()
        .execute();
      // console.log("10. Upserted OAuth account for existing user");

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

    const nameParts = githubUser.name?.split(" ") ?? [];

    // const stripeCustomerId = await createCustomerId(userId, primaryEmail.email);
    const stripeCustomerId = crypto.randomUUID();

    const { pushTo } = await upsertUser(db, {
      userId,
      displayName: githubUser.login,
      email: primaryEmail.email,
      firstName: nameParts[0] ?? "",
      lastName: nameParts[1] ?? "",
      stripeCustomerId,
      providerName: "github",
      providerUserId: githubUser.id,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    // console.log("15. Created session for new user", { session });
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    console.error("error", e);
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
  } finally {
    pool.end();
  }
}

interface GitHubUser {
  id: string;
  login: string;
  name?: string;
}
