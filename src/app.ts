import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { isErrorResult, merge } from 'openapi-merge';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { initLogger, logger } from '@/lib/logger';
import { notFound } from '@/middlewares/not-found';
import { onError } from '@/middlewares/on-error';
import { tasksRouter } from '@/modules/tasks/tasks.index';

const app = createRouter();

// Initialize Logger
await initLogger();

// Global middleware
app.use('*', cors());

// Better Auth
app.on(['POST', 'GET'], '/api/*', (c) => {
	const env = validateEnv(c.env);
	return auth(env).handler(c.req.raw);
});

// Feature modules
app.route('/tasks', tasksRouter);

// OpenAPI
app.get('/openapi.json', async (c) => {
	const env = validateEnv(c.env);
	const authInstance = auth(env);

	// 1. Generate Hono App Specs
	const appSpecs = app.getOpenAPIDocument({
		openapi: '3.1.0',
		info: {
			title: 'Worker API',
			version: '1.0.0',
			description: 'Cloudflare Worker API',
		},
		servers: [{ url: env.BETTER_AUTH_URL, description: 'Current server' }],
	});

	// Ensure bearerAuth is registered as standard schema (better-auth uses it)
	appSpecs.components = appSpecs.components || {};
	appSpecs.components.securitySchemes =
		appSpecs.components.securitySchemes || {};
	appSpecs.components.securitySchemes.bearerAuth = {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT',
		description: 'Better Auth bearer token',
	};

	try {
		// 2. Fetch Better Auth Specs
		const authResponse = await authInstance.handler(
			new Request(new URL('/api/open-api/generate-schema', env.BETTER_AUTH_URL))
		);
		const authSpecs = await authResponse.json();

		if (authSpecs && typeof authSpecs === 'object') {
			// 3. Professional Merge using openapi-merge
			const mergeResult = merge([
				{ oas: appSpecs as any },
				{
					oas: authSpecs as any,
					pathModification: { prepend: '/api' },
				},
			]);

			if (!isErrorResult(mergeResult)) {
				return c.json(mergeResult.output);
			}
		}
	} catch (e) {
		logger.error('Failed to merge Better Auth specs', { error: e });
	}

	return c.json(appSpecs);
});

// Scalar
app.get(
	'/docs',
	Scalar({
		theme: 'kepler',
		honoRouting: true,
		spec: {
			url: '/openapi.json',
		},
	} as any)
);

// Custom 404 handler
app.notFound(notFound);

// Custom error handler
app.onError(onError);

export default app;
