import type { AppContext } from '@/factory';
import { TasksService } from '@/modules/tasks/tasks.service';

export const listHandler = async (c: AppContext) => {
	const service = new TasksService(c.env.DATABASE_URL);
	const taskList = await service.getTasks();
	return c.json(taskList, 200);
};

export const getHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.getTaskById(id);
	return c.json(task, 200);
};

export const createHandler = async (c: AppContext) => {
	const data = c.req.valid('json' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.createTask(data);
	return c.json(task, 201);
};

export const updateHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const data = c.req.valid('json' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	const task = await service.updateTask(id, data);
	return c.json(task, 200);
};

export const deleteHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new TasksService(c.env.DATABASE_URL);
	await service.deleteTask(id);
	return c.body(null, 204);
};
