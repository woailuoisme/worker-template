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
		},
		runtimeEnv: runtimeEnv as Record<string, string>,
		emptyStringAsUndefined: true,
	});
}
