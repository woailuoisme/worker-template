import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	BETTER_AUTH_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(1),
	APP_NAME: z.string().default('Tasks API'),
	/** Sentry DSN – leave empty to disable error reporting */
	SENTRY_DSN: z.string().url().optional(),
	/** Resend API key – leave empty to disable email sending */
	RESEND_API_KEY: z.string().min(1).optional(),
	/** Sender address shown in outgoing emails */
	RESEND_FROM_EMAIL: z.string().email().default('noreply@localhost'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(runtimeEnv: unknown): Env {
	return createEnv({
		server: {
			DATABASE_URL: z.string().url(),
			NODE_ENV: z
				.enum(['development', 'production', 'test'])
				.default('development'),
			BETTER_AUTH_URL: z.string().url(),
			BETTER_AUTH_SECRET: z.string().min(1),
			APP_NAME: z.string().default('Tasks API'),
			SENTRY_DSN: z.string().url().optional(),
			RESEND_API_KEY: z.string().min(1).optional(),
			RESEND_FROM_EMAIL: z.string().email().default('noreply@localhost'),
		},
		runtimeEnv: runtimeEnv as Record<string, string>,
		emptyStringAsUndefined: true,
	});
}
