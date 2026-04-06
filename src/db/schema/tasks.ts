import { z } from '@hono/zod-openapi';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const tasks = pgTable('tasks', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	status: varchar('status', { length: 50 }).default('pending').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectTaskSchema = createSelectSchema(tasks).openapi('Task');
export const insertTaskSchema = createInsertSchema(tasks, {
	title: z.string().min(1).max(255),
	status: z
		.enum(['pending', 'in_progress', 'completed'])
		.optional()
		.default('pending'),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateTaskSchema = insertTaskSchema.partial();
export type Task = z.infer<typeof selectTaskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
