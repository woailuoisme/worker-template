import { z } from '@hono/zod-openapi';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * Source of truth for task statuses.
 * Used for both Drizzle enum and Zod validation.
 */
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;

export const tasks = pgTable('tasks', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	status: text('status', { enum: TASK_STATUSES }).default('pending').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

/**
 * Zod schemas for validation and OpenAPI documentation.
 * Derived from the Drizzle table definition to prevent drift.
 */
const selectTaskSchema = createSelectSchema(tasks, {
	status: z.enum(TASK_STATUSES, { error: 'Invalid status' }),
	createdAt: z.iso.datetime({ error: 'Invalid creation timestamp' }),
	updatedAt: z.iso.datetime({ error: 'Invalid update timestamp' }),
}).openapi('Task');

const insertTaskSchema = createInsertSchema(tasks, {
	title: (s) =>
		s
			.min(1, { error: 'Title is required' })
			.max(255, { error: 'Title is too long' }),
	status: z
		.enum(TASK_STATUSES, { error: 'Invalid task status' })
		.optional()
		.default('pending'),
})
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.openapi('InsertTask');

const updateTaskSchema = insertTaskSchema.partial().openapi('UpdateTask');

export const TaskSchemas = {
	select: selectTaskSchema,
	insert: insertTaskSchema,
	update: updateTaskSchema,
};

/**
 * Types inferred from Zod schemas for consistent API/service usage.
 */
export type Task = z.infer<typeof selectTaskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
