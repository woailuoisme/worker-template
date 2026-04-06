import { createRoute, z } from '@hono/zod-openapi';
import { createRouter } from '@/factory';
import { apiErrorSchema, apiSuccessSchema } from '@/lib/response';
import * as handlers from './articles.handlers';

const router = createRouter();

const tags = ['Articles'];

const idParamSchema = z.object({
	id: z.string().openapi({ example: '123' }),
});

export const listArticlesRoute = createRoute({
	method: 'get',
	path: '/',
	tags,
	summary: 'List articles',
	operationId: 'listArticles',
	responses: {
		200: {
			description: 'List of articles',
			content: {
				'application/json': { schema: apiSuccessSchema(z.array(z.any())) },
			},
		},
	},
});
router.openapi(listArticlesRoute, handlers.listHandler);

export const getArticlesRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags,
	summary: 'Get articles by ID',
	operationId: 'getArticles',
	request: {
		params: idParamSchema,
	},
	responses: {
		200: {
			description: 'Articles details',
			content: { 'application/json': { schema: apiSuccessSchema(z.any()) } },
		},
		404: {
			description: 'Not found',
			content: { 'application/json': { schema: apiErrorSchema } },
		},
	},
});
router.openapi(getArticlesRoute, handlers.getHandler);

export { router as articlesRouter };
