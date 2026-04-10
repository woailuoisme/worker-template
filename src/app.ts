import { sentry } from '@hono/sentry';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { initLogger } from '@/lib/logger';
import { logtapeLogger } from '@/middlewares/logtape-logger';
import { notFound } from '@/middlewares/not-found';
import { onError } from '@/middlewares/on-error';
import { getOpenApiRouter } from '@/routers/openapi.routes';
import { v1Router } from '@/routers/v1.routes';

// Initialize Logger before middleware chain
await initLogger();

const app = createRouter();

// ---------------------------------------------------------------------------
// Global middleware — order matters:
//  1. contextStorage  — enables Hono context access outside handlers
//  2. requestId       — injects X-Request-Id for full chain traceability
//  3. sentry          — error reporting (needs requestId available)
//  4. logtapeLogger   — HTTP access log bound to requestId
// ---------------------------------------------------------------------------
app.use('*', contextStorage());
app.use('*', requestId());
app.use('*', sentry());
app.use('*', logtapeLogger());

// API CORS — all /api/* routes share the same trusted-origin policy
app.use('/api/*', async (c, next) => {
	const env = validateEnv(c.env);
	const trustedOrigins = env.AUTH_TRUSTED_ORIGINS ?? [];
	const corsMiddleware = cors({
		origin: (origin) => {
			return trustedOrigins.includes(origin) ? origin : '';
		},
		credentials: true,
		allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	});

	return corsMiddleware(c, next);
});

// Better Auth — scoped to /api/auth/* (basePath matches lib/auth.ts)
app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
	const env = validateEnv(c.env);
	return auth(env, c.executionCtx).handler(c.req.raw);
});

// Feature modules — versioned under /api/v1
app.route('/api/v1', v1Router);

// OpenAPI documentation routes
app.route('/', getOpenApiRouter(app));

// Custom 404 handler
app.notFound(notFound);

// Custom error handler
app.onError(onError);

export default app;
