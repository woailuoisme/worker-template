import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { parseTrustedOrigins } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Single schema definition — used by both Env type and validateEnv()
// ---------------------------------------------------------------------------

const serverSchema = {
	DATABASE_URL: z.url({ error: 'DATABASE_URL must be a valid URL' }),
	NODE_ENV: z
		.enum(['development', 'production', 'test'], { error: 'Invalid NODE_ENV' })
		.default('development'),
	BETTER_AUTH_URL: z.url({ error: 'BETTER_AUTH_URL must be a valid URL' }),
	BETTER_AUTH_SECRET: z
		.string()
		.min(1, { error: 'BETTER_AUTH_SECRET is required' }),
	AUTH_TRUSTED_ORIGINS: z
		.string()
		.optional()
		.transform((value) => parseTrustedOrigins(value)),
	APP_NAME: z.string().default('Tasks API'),
	/** Sentry DSN – leave empty to disable error reporting */
	SENTRY_DSN: z.url().optional(),
	/** Resend API key – leave empty to disable email sending */
	RESEND_API_KEY: z.string().min(1).optional(),
	/** Sender address shown in outgoing emails */
	RESEND_FROM_EMAIL: z
		.email({ error: 'Invalid sender email format' })
		.default('noreply@localhost'),
} as const;

export const envSchema = z.object(serverSchema);

type BaseEnv = z.infer<typeof envSchema>;

export type Env = Omit<BaseEnv, 'AUTH_TRUSTED_ORIGINS'> & {
	AUTH_TRUSTED_ORIGINS?: string[];
};

/**
 * Validates runtime environment variables using t3-env.
 * Call this once per request/boot — the result is typed as Env.
 */
export function validateEnv(runtimeEnv: unknown): Env {
	return createEnv({
		server: serverSchema,
		runtimeEnv: runtimeEnv as Record<string, string>,
		emptyStringAsUndefined: true,
	});
}
