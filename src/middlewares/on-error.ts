import type { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from '@/lib/logger';

export const onError: ErrorHandler = (err: Error, c: Context) => {
	logger.error(err.message, { error: err });
	if (err instanceof HTTPException) {
		return c.json(
			{
				message: err.message,
			},
			err.status
		);
	}
	return c.json(
		{
			message: 'Internal Server Error',
		},
		500
	);
};
