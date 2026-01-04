import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Use POSTGRES_URL if available, otherwise construct from Supabase environment variables
let postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // Fallback: construct a basic connection string
  // In production, POSTGRES_URL should be explicitly set with the database password
  console.warn('Warning: POSTGRES_URL not set. Database operations may fail.');
  postgresUrl = 'postgresql://localhost/postgres';
}

if (!postgresUrl) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

export const client = postgres(postgresUrl);
export const db = drizzle(client, { schema });

