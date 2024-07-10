import * as schema from "./schema";
import { Pool, neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { Database } from "./types";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("PostgreSQL connection string is not defined");
}

export const createPooledConnection = () => {
  const pool = new Pool({ connectionString });
  return {
    db: drizzleWs(pool, { schema }),
    pool,
  };
};

export async function pool<TReturn>(
  callback: (arg: { db: Database; s: typeof schema }) => Promise<TReturn>,
) {
  const { db, pool } = createPooledConnection();
  // pool.connect();
  try {
    return await callback({ db, s: schema });
  } catch (error) {
    throw error;
  } finally {
    pool.end();
  }
}
