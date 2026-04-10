import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendError } from '@/lib/response';

/**
 * Global error handler middleware.
 *
 * Catch order:
 *  1. HTTPException  → forward status + message
 *  2. AppError       → forward statusCode + structured details
 *  3. Unknown        → 500 Internal Server Error
 *
 * All errors include the requestId for traceability.
 */
export const onError: ErrorHandler = (err, c) => {
	const requestId = c.get('requestId') ?? 'unknown';
	const log = c.get('logger') ?? logger;

	log.error('{name}: {message} | req={requestId}', {
		name: err.name,
		message: err.message,
		requestId,
		error: err,
	});

	// Forward the exception to Sentry (no-op if SENTRY_DSN is not set)
	c.get('sentry')?.captureException(err);

	if (err instanceof HTTPException) {
		return sendError(c, err.status, err.message, {
			errorCode: 'HTTP_EXCEPTION',
		});
	}

	if (err instanceof AppError) {
		return sendError(c, err.statusCode, err.message, {
			errorCode: err.name,
			errors: err.details as Record<string, string[]> | undefined,
		});
	}

	return sendError(
		c,
		HttpStatusCodes.INTERNAL_SERVER_ERROR,
		'Internal Server Error',
		{
			errorCode: 'INTERNAL_SERVER_ERROR',
		}
	);
};
