import * as schema from "./schema";
import { Pool, neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { pool } from "./pool";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("PostgreSQL connection string is not defined");
}

export const http = neon<boolean, boolean>(connectionString);

const db = drizzleHttp(http, { schema });

export { db, schema, pool };
