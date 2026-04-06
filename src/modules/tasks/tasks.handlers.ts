import type { AppContext } from '@/factory';
import { sendPaginated, sendSuccess } from '@/lib/response';
import { TasksService } from '@/modules/tasks/tasks.service';

export const listHandler = async (c: AppContext) => {
	const { page = 1, limit = 10 } = c.req.valid('query' as never) || {};
	const service = new TasksService(c.env.DATABASE_URL);
	const { items, total } = await service.getTasks({ page, limit });

	return sendPaginated(c, items, {
		page,
		limit,
		total,
	});
};

export const getHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.getTaskById(id);
	return sendSuccess(c, task);
};

export const createHandler = async (c: AppContext) => {
	const data = c.req.valid('json' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.createTask(data);
	return sendSuccess(c, task, { code: 201, message: 'Task created' });
};

export const updateHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const data = c.req.valid('json' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.updateTask(id, data);
	return sendSuccess(c, task, { message: 'Task updated' });
};

export const deleteHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	await service.deleteTask(id);
	return sendSuccess(c, null, { message: 'Task deleted' });
};
