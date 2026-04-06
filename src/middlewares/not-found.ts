import type { NotFoundHandler } from 'hono';

export const notFound: NotFoundHandler = (c) => {
	return c.json(
		{
			message: `${c.req.method} ${c.req.path} Not Found`,
		},
		404
	);
};
