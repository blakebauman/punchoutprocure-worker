import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/d1';

// Assuming `env.DB` is the database binding
export const db = (env: any) => drizzle(new D1Database(env.DB));
