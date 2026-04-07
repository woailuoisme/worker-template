import type { AppContext } from '@/factory';
import { sendPaginated, sendSuccess } from '@/lib/response';
import { TasksService } from '@/modules/tasks/tasks.service';

/**
 * TasksHandlers handles the HTTP request/response logic.
 * It extracts data from the context and calls the Service layer.
 */
export const TasksHandlers = {
	list: async (c: AppContext) => {
		const { page = 1, limit = 10 } = (c.req.valid('query' as never) ||
			{}) as any;
		const { items, total } = await TasksService.list({ page, limit });
		return sendPaginated(c, items, { page, limit, total });
	},

	get: async (c: AppContext) => {
		const { id } = c.req.valid('param' as never);
		const task = await TasksService.getById(id);
		return sendSuccess(c, task);
	},

	create: async (c: AppContext) => {
		const data = c.req.valid('json' as never);
		const task = await TasksService.create(data);
		return sendSuccess(c, task, { code: 201, message: 'Task created' });
	},

	update: async (c: AppContext) => {
		const { id } = c.req.valid('param' as never);
		const data = c.req.valid('json' as never);
		const task = await TasksService.update(id, data);
		return sendSuccess(c, task, { message: 'Task updated' });
	},

	remove: async (c: AppContext) => {
		const { id } = c.req.valid('param' as never);
		await TasksService.remove(id);
		return sendSuccess(c, null, { message: 'Task deleted' });
	},
};
