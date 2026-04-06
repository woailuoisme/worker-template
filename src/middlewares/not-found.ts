import type { NotFoundHandler } from 'hono';
import { sendError } from '@/lib/response';

export const notFound: NotFoundHandler = (c) => {
	return sendError(c, 404, `${c.req.method} ${c.req.path} Not Found`, {
		errorCode: 'NOT_FOUND',
	});
};
