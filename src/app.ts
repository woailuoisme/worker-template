import { sentry } from '@hono/sentry';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { initLogger } from '@/lib/logger';
import { notFound } from '@/middlewares/not-found';
import { onError } from '@/middlewares/on-error';
import { getOpenApiRouter } from '@/routers/openapi.routes';
import { v1Router } from '@/routers/v1.routes';

const app = createRouter();

// Initialize Logger
await initLogger();

// Global middleware
app.use('*', contextStorage());
app.use('*', sentry());
app.use('*', cors());

// Better Auth — scoped to /api/auth/* (basePath matches lib/auth.ts)
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	const env = validateEnv(c.env);
	return auth(env, c.executionCtx).handler(c.req.raw);
});

// Feature modules — versioned under /api/v1
app.route('/api/v1', v1Router);

// OpenAPI routes — moved to src/routers/openapi.routes.ts
app.route('/', getOpenApiRouter(app));

// Custom 404 handler
app.notFound(notFound);

// Custom error handler
app.onError(onError);

export default app;
