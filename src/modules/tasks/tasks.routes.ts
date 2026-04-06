import { createRoute, z } from '@hono/zod-openapi';
import {
	insertTaskSchema,
	selectTaskSchema,
	updateTaskSchema,
} from '@/db/schema';
import { createRouter } from '@/factory';
import {
	apiErrorSchema,
	apiPaginatedSchema,
	apiSuccessSchema,
} from '@/lib/response';
import * as handlers from '@/modules/tasks/tasks.handlers';

const router = createRouter();

const tags = ['Tasks'];

const idParamSchema = z.object({
	id: z
		.string()
		.uuid()
		.openapi({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' }),
});

export const listTasksRoute = createRoute({
	method: 'get',
	path: '/',
	tags,
	summary: 'List tasks',
	operationId: 'listTasks',
	request: {
		query: z.object({
			page: z.coerce.number().optional().default(1),
			limit: z.coerce.number().optional().default(10),
		}),
	},
	responses: {
		200: {
			description: 'List of tasks',
			content: {
				'application/json': { schema: apiPaginatedSchema(selectTaskSchema) },
			},
		},
	},
});
router.openapi(listTasksRoute, handlers.listHandler);

export const getTaskRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags,
	summary: 'Get task by ID',
	operationId: 'getTask',
	request: {
		params: idParamSchema,
	},
	responses: {
		200: {
			description: 'Task details',
			content: {
				'application/json': { schema: apiSuccessSchema(selectTaskSchema) },
			},
		},
		404: {
			description: 'Task not found',
			content: { 'application/json': { schema: apiErrorSchema } },
		},
	},
});
router.openapi(getTaskRoute, handlers.getHandler);

export const createTaskRoute = createRoute({
	method: 'post',
	path: '/',
	tags,
	summary: 'Create task',
	operationId: 'createTask',
	request: {
		body: {
			content: {
				'application/json': { schema: insertTaskSchema },
			},
		},
	},
	responses: {
		201: {
			description: 'Created task',
			content: {
				'application/json': { schema: apiSuccessSchema(selectTaskSchema) },
			},
		},
		422: {
			description: 'Validation Error',
			content: { 'application/json': { schema: apiErrorSchema } },
		},
	},
});
router.openapi(createTaskRoute, handlers.createHandler);

export const updateTaskRoute = createRoute({
	method: 'patch',
	path: '/{id}',
	tags,
	summary: 'Update task',
	operationId: 'updateTask',
	request: {
		params: idParamSchema,
		body: {
			content: {
				'application/json': { schema: updateTaskSchema },
			},
		},
	},
	responses: {
		200: {
			description: 'Updated task',
			content: {
				'application/json': { schema: apiSuccessSchema(selectTaskSchema) },
			},
		},
		404: {
			description: 'Task not found',
			content: { 'application/json': { schema: apiErrorSchema } },
		},
	},
});
router.openapi(updateTaskRoute, handlers.updateHandler);

export const deleteTaskRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags,
	summary: 'Delete task',
	operationId: 'deleteTask',
	request: {
		params: idParamSchema,
	},
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
});
router.openapi(deleteTaskRoute, handlers.deleteHandler);

export { router as tasksRouter };
