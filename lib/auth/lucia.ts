import "server-only";

import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";
import { GitHub, Google } from "arctic";
import { createPooledConnection } from "../db/pool";
import * as schema from "../db/schema";

const { db } = createPooledConnection();

const adapter = new DrizzlePostgreSQLAdapter(db, schema.session, schema.user);

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID || "",
  process.env.GITHUB_CLIENT_SECRET || "",
);

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const redirectUrl = `${baseUrl}/api/auth/google/callback`;

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUrl,
);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      // set to 'true' when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: ({ displayName, isAdmin, email, stripeCustomerId }) => {
    return { displayName, isAdmin, email, stripeCustomerId };
  },
  // getSessionAttributes: () => {
  //   return { country };
  // }
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      displayName: string;
      isAdmin: boolean;
      email: string;
      stripeCustomerId: string;
    };
    DatabaseSessionAttributes: {};
  }
}
