import type { AppRouteHandler } from '@/factory';
import { sendPaginated, sendSuccess } from '@/lib/response';
import type { routes } from '@/modules/tasks/tasks.routes';
import { TasksService } from '@/modules/tasks/tasks.service';

/**
 * TasksHandlers: thin HTTP glue layer.
 *
 * Responsibilities:
 *  - Extract validated data from Hono context (set by zod-openapi validator)
 *  - Call the appropriate TasksService method
 *  - Map the result to a structured HTTP response
 *
 * TasksService is pure — it never receives Context objects.
 */
export const TasksHandlers = {
	list: (async (c) => {
		const { page = 1, limit = 10 } = c.req.valid('query');
		const { items, total } = await TasksService.list({ page, limit });
		return sendPaginated(c, items, { page, limit, total });
	}) satisfies AppRouteHandler<typeof routes.list>,

	get: (async (c) => {
		const { id } = c.req.valid('param');
		const task = await TasksService.getById(id);
		return sendSuccess(c, task);
	}) satisfies AppRouteHandler<typeof routes.get>,

	create: (async (c) => {
		const data = c.req.valid('json');
		const task = await TasksService.create(data);
		return sendSuccess(c, task, { code: 201, message: 'Task created' });
	}) satisfies AppRouteHandler<typeof routes.create>,

	update: (async (c) => {
		const { id } = c.req.valid('param');
		const data = c.req.valid('json');
		const task = await TasksService.update(id, data);
		return sendSuccess(c, task, { message: 'Task updated' });
	}) satisfies AppRouteHandler<typeof routes.update>,

	remove: (async (c) => {
		const { id } = c.req.valid('param');
		await TasksService.remove(id);
		return sendSuccess(c, null, { message: 'Task deleted' });
	}) satisfies AppRouteHandler<typeof routes.delete>,
};
