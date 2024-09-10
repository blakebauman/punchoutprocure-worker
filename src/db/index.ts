import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Assuming `env.DB` is the database binding
export const db = (env: any) => drizzle(env.DB, { schema });
