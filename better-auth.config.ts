/**
 * Better Auth CLI configuration file
 *
 * Docs: https://www.better-auth.com/docs/concepts/cli
 */
import { existsSync } from 'node:fs';

if (existsSync('.dev.vars')) {
	process.loadEnvFile('.dev.vars');
} else if (existsSync('.env')) {
	process.loadEnvFile('.env');
}

import { neon } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema/auth';
import { betterAuthOptions, parseTrustedOrigins } from './src/lib/auth';

const {
	DATABASE_URL,
	BETTER_AUTH_URL,
	BETTER_AUTH_SECRET,
	AUTH_TRUSTED_ORIGINS,
} = process.env;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined');
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);
const trustedOrigins = parseTrustedOrigins(AUTH_TRUSTED_ORIGINS);

export const auth = betterAuth({
	...betterAuthOptions,
	database: drizzleAdapter(db, { provider: 'pg', schema }), // schema is required in order for bettter-auth to recognize
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
	...(trustedOrigins ? { trustedOrigins } : {}),
});
