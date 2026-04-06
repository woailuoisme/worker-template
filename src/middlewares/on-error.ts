import type { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendError } from '@/lib/response';

export const onError: ErrorHandler = (err: Error, c: Context) => {
	logger.error(err.message, { error: err });

	// Forward the exception to Sentry (no-op if SENTRY_DSN is not set)
	c.get('sentry')?.captureException(err);

	if (err instanceof HTTPException) {
		return sendError(c, err.status, err.message);
	}

	if (err instanceof AppError) {
		return sendError(c, err.statusCode, err.message, {
			errorCode: err.name,
			errors: err.details,
		});
	}

	return sendError(c, 500, 'Internal Server Error', {
		errorCode: 'INTERNAL_SERVER_ERROR',
	});
};
