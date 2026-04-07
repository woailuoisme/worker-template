import { createRoute, z } from '@hono/zod-openapi';
import { createRouter } from '@/factory';
import {
	apiErrorSchema,
	apiPaginatedSchema,
	apiSuccessSchema,
	paginationQuerySchema,
} from '@/lib/response';
import { TasksHandlers } from '@/modules/tasks/tasks.handlers';
import { TaskSchemas } from '@/modules/tasks/tasks.schema';

const router = createRouter();
const tags = ['Tasks'];

const idParamSchema = z.object({
	id: z
		.uuid({ error: 'Invalid Task ID (UUID required)' })
		.openapi({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' }),
});

/**
 * Route Definitions
 */
export const routes = {
	list: createRoute({
		method: 'get',
		path: '/',
		tags,
		summary: 'List tasks',
		operationId: 'listTasks',
		request: { query: paginationQuerySchema },
		responses: {
			200: {
				description: 'List of tasks',
				content: {
					'application/json': {
						schema: apiPaginatedSchema(TaskSchemas.select),
					},
				},
			},
		},
	}),

	get: createRoute({
		method: 'get',
		path: '/{id}',
		tags,
		summary: 'Get task by ID',
		operationId: 'getTask',
		request: { params: idParamSchema },
		responses: {
			200: {
				description: 'Task details',
				content: {
					'application/json': { schema: apiSuccessSchema(TaskSchemas.select) },
				},
			},
			404: {
				description: 'Task not found',
				content: { 'application/json': { schema: apiErrorSchema } },
			},
		},
	}),

	create: createRoute({
		method: 'post',
		path: '/',
		tags,
		summary: 'Create task',
		operationId: 'createTask',
		request: {
			body: { content: { 'application/json': { schema: TaskSchemas.insert } } },
		},
		responses: {
			201: {
				description: 'Created task',
				content: {
					'application/json': { schema: apiSuccessSchema(TaskSchemas.select) },
				},
			},
			422: {
				description: 'Validation Error',
				content: { 'application/json': { schema: apiErrorSchema } },
			},
		},
	}),

	update: createRoute({
		method: 'patch',
		path: '/{id}',
		tags,
		summary: 'Update task',
		operationId: 'updateTask',
		request: {
			params: idParamSchema,
			body: { content: { 'application/json': { schema: TaskSchemas.update } } },
		},
		responses: {
			200: {
				description: 'Updated task',
				content: {
					'application/json': { schema: apiSuccessSchema(TaskSchemas.select) },
				},
			},
			404: {
				description: 'Task not found',
				content: { 'application/json': { schema: apiErrorSchema } },
			},
		},
	}),

	delete: createRoute({
		method: 'delete',
		path: '/{id}',
		tags,
		summary: 'Delete task',
		operationId: 'deleteTask',
		request: { params: idParamSchema },
		responses: {
			200: {
				description: 'Task deleted',
				content: { 'application/json': { schema: apiSuccessSchema(z.null()) } },
			},
			404: {
				description: 'Task not found',
				content: { 'application/json': { schema: apiErrorSchema } },
			},
		},
	}),
};

/**
 * Router Implementation
 */
router.openapi(routes.list, TasksHandlers.list);
router.openapi(routes.get, TasksHandlers.get);
router.openapi(routes.create, TasksHandlers.create);
router.openapi(routes.update, TasksHandlers.update);
router.openapi(routes.delete, TasksHandlers.remove);

export { router as tasksRouter };
