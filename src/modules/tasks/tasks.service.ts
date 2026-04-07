import { count, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
	type InsertTask,
	type Task,
	tasks,
} from '@/modules/tasks/tasks.schema';

/**
 * Domain-specific errors for the Tasks module.
 */
export class TaskNotFoundError extends Error {
	constructor(id: string) {
		super(`Task with id ${id} not found`);
		this.name = 'TaskNotFoundError';
	}
}

/**
 * Helper to format DB task to API task (converts Dates to ISO strings)
 */
const formatTask = (task: any): Task => ({
	...task,
	createdAt: task.createdAt.toISOString(),
	updatedAt: task.updatedAt.toISOString(),
});

/**
 * TasksService handles the core business logic for tasks.
 */
export const TasksService = {
	list: async (options: {
		page: number;
		limit: number;
	}): Promise<{ items: Task[]; total: number }> => {
		const db = getDb();
		const offset = (options.page - 1) * options.limit;

		const [totalResult, items] = await Promise.all([
			db.select({ value: count() }).from(tasks),
			db.query.tasks.findMany({
				orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
				limit: options.limit,
				offset,
			}),
		]);

		return {
			items: items.map(formatTask),
			total: totalResult[0]?.value ?? 0,
		};
	},

	getById: async (id: string): Promise<Task> => {
		const db = getDb();
		const task = await db.query.tasks.findFirst({
			where: (tasks, { eq }) => eq(tasks.id, id),
		});

		if (!task) {
			throw new TaskNotFoundError(id);
		}
		return formatTask(task);
	},

	create: async (data: InsertTask): Promise<Task> => {
		const db = getDb();
		const [task] = await db.insert(tasks).values(data).returning();

		if (!task) {
			throw new Error('Failed to create task');
		}
		return formatTask(task);
	},

	update: async (id: string, data: Partial<InsertTask>): Promise<Task> => {
		const db = getDb();
		const [task] = await db
			.update(tasks)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(tasks.id, id))
			.returning();

		if (!task) {
			throw new TaskNotFoundError(id);
		}
		return formatTask(task);
	},

	remove: async (id: string): Promise<void> => {
		const db = getDb();
		const [result] = await db
			.delete(tasks)
			.where(eq(tasks.id, id))
			.returning({ deletedId: tasks.id });

		if (!result) {
			throw new TaskNotFoundError(id);
		}
	},
};
