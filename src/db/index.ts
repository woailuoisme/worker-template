import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Provide a way to initialize the DB per request or globally.
let dbInstance: ReturnType<typeof drizzle>;

export function getDb(databaseUrl: string) {
	if (!dbInstance) {
		const sql = neon(databaseUrl);
		dbInstance = drizzle(sql);
	}
	return dbInstance;
}
