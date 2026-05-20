import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.ts';

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const queryClient = postgres(process.env.DATABASE_URL, { max: 10, prepare: false });
export const db = drizzle(queryClient, { schema });

export async function connectDB() {
    try {
        await queryClient`SELECT 1`;
        console.log("✅ Connected to Supabase Postgres");
    } catch (error) {
        console.error("❌ Postgres connection error:", error);
        process.exit(1);
    }
}
