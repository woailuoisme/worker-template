import { sentry } from '@hono/sentry';
import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import { cors } from 'hono/cors';
import { isErrorResult, merge } from 'openapi-merge';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { initLogger, logger } from '@/lib/logger';
import { notFound } from '@/middlewares/not-found';
import { onError } from '@/middlewares/on-error';
import { articlesRouter } from '@/modules/articles/articles.index';
import { tasksRouter } from '@/modules/tasks/tasks.index';

const app = createRouter();

// Initialize Logger
await initLogger();

// Global middleware
app.use('*', sentry());
app.use('*', cors());

// Better Auth — scoped to /api/auth/* (basePath matches lib/auth.ts)
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	const env = validateEnv(c.env);
	return auth(env).handler(c.req.raw);
});

// Feature modules — versioned under /api/v1
app.route('/api/v1/tasks', tasksRouter);
app.route('/api/v1/articles', articlesRouter);

// Helper to generate OpenAPI spec
async function generateOpenApiSpec(c: any, app: any) {
	const env = validateEnv(c.env);
	const authInstance = auth(env);

	const appSpecs = app.getOpenAPI31Document({
		openapi: '3.1.0',
		info: {
			title: 'Worker API',
			version: '1.0.0',
			description: 'Cloudflare Worker API',
		},
		servers: [{ url: env.BETTER_AUTH_URL, description: 'Current server' }],
	});

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
		const authResponse = await authInstance.handler(
			new Request(
				new URL('/api/auth/open-api/generate-schema', env.BETTER_AUTH_URL)
			)
		);
		const authSpecs = await authResponse.json();

		if (authSpecs && typeof authSpecs === 'object') {
			const mergeResult = merge([
				{ oas: appSpecs as any },
				{
					oas: authSpecs as any,
					pathModification: { prepend: '/api/auth' },
				},
			]);

			if (!isErrorResult(mergeResult)) {
				return mergeResult.output;
			}
		}
	} catch (e) {
		logger.error('Failed to merge Better Auth specs', { error: e });
	}

	return appSpecs;
}

// OpenAPI
app.get('/openapi.json', async (c) => {
	const specs = await generateOpenApiSpec(c, app);
	return c.json(specs);
});

/**
 * Register a route to serve the Markdown for LLMs
 *
 * Q: Why /llms.txt?
 * A: It's a proposal to standardise on using an /llms.txt file.
 *
 * @see https://llmstxt.org/
 */
app.get('/llms.txt', async (c) => {
	const specs = await generateOpenApiSpec(c, app);
	// const markdown = await createMarkdownFromOpenApi(specs);
	const markdown = await createMarkdownFromOpenApi(JSON.stringify(specs));
	return c.text(markdown);
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
