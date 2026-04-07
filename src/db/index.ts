import { getLogger } from '@logtape/drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getContext } from 'hono/context-storage';
import { validateEnv } from '@/env';
import type { AppEnv } from '@/factory';

import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Global cache for the database instance.
 * In a serverless environment, this helps reuse the connection across warm starts.
 */
let globalDb: DB | null = null;

/**
 * Initialize the DB per request or globally.
 * Uses neon-http driver for serverless compatibility.
 */
export function createDb(databaseUrl: string): DB {
	const sql = neon(databaseUrl);
	return drizzle(sql, {
		schema,
		logger: getLogger(),
	});
}

/**
 * Get the database instance directly.
 * This can be used in services to get the DB connection without passing it around.
 * It uses Hono's context storage to retrieve the environment variables.
 */
export function getDb(): DB {
	// For CLI/Seeder tools where process.env is available
	if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
		if (!globalDb) {
			globalDb = createDb(process.env.DATABASE_URL);
		}
		return globalDb;
	}

	// For Request context
	try {
		const c = getContext<AppEnv>();
		const env = validateEnv(c.env);
		return createDb(env.DATABASE_URL);
	} catch (_e) {
		throw new Error(
			'Database connection could not be established. Ensure you are within a request context or DATABASE_URL is set.'
		);
	}
}

export { schema };
