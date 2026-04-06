import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { type InsertTask, type Task, tasks } from '@/db/schema';
import { NotFoundError } from '@/lib/errors';

export class TasksService {
	constructor(private readonly dbUrl: string) {}

	private get db() {
		return getDb(this.dbUrl);
	}

	async getTasks(): Promise<Task[]> {
		return await this.db.select().from(tasks).orderBy(tasks.createdAt);
	}

	async getTaskById(id: string): Promise<Task> {
		const [task] = await this.db.select().from(tasks).where(eq(tasks.id, id));
		if (!task) {
			throw new NotFoundError(`Task with id ${id} not found`);
		}
		return task;
	}

	async createTask(data: InsertTask): Promise<Task> {
		const [task] = await this.db
			.insert(tasks)
			.values({
				title: data.title,
				description: data.description,
				status: data.status,
			})
			.returning();
		// .returning() always returns the inserted row, so this is safe
		return task as Task;
	}

	async updateTask(id: string, data: Partial<InsertTask>): Promise<Task> {
		const [task] = await this.db
			.update(tasks)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(tasks.id, id))
			.returning();

		if (!task) {
			throw new NotFoundError(`Task with id ${id} not found`);
		}
		return task;
	}

	async deleteTask(id: string): Promise<void> {
		const [result] = await this.db
			.delete(tasks)
			.where(eq(tasks.id, id))
			.returning({ deletedId: tasks.id });
		if (!result) {
			throw new NotFoundError(`Task with id ${id} not found`);
		}
	}
}
