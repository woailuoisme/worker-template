import { neon } from '@neondatabase/serverless';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, jwt, openAPI, username } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/neon-http';
import type { Env } from '@/env';

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
	/**
	 * Base path for Better Auth.
	 * @default "/api/auth"
	 */
	basePath: '/api/auth',

	plugins: [openAPI(), jwt(), bearer(), username()],
};

/**
 * Better Auth Instance
 */
export const auth = (env: Env) => {
	const sql = neon(env.DATABASE_URL);
	const db = drizzle(sql);

	return betterAuth({
		...betterAuthOptions,
		appName: env.APP_NAME,
		database: drizzleAdapter(db, { provider: 'pg' }),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
	});
};
