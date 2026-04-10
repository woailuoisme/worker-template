import type { MiddlewareHandler } from 'hono';
import { getAppLogger } from '@/lib/logger';

/**
 * Logtape HTTP request logger middleware.
 *
 * - Binds the requestId (set by requestIdMiddleware) to the logger context.
 * - Stores a request-scoped logger in `c.var.logger` for use in handlers and services.
 * - Logs method, URL, status, and duration for every request.
 */
export function logtapeLogger(): MiddlewareHandler {
	return async (c, next) => {
		const requestId = c.get('requestId') ?? crypto.randomUUID();
		const logger = getAppLogger('http');
		c.set('logger', logger);

		const start = Date.now();
		await next();
		const ms = Date.now() - start;

		logger.info('{method} {url} {status} {ms}ms | req={requestId}', {
			method: c.req.method,
			url: c.req.path,
			status: c.res.status,
			ms,
			requestId,
		});
	};
}
