import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock external dependencies BEFORE importing modules that use them
// ---------------------------------------------------------------------------

vi.mock('@neondatabase/serverless', () => ({
	neon: vi.fn().mockImplementation(() => () => {}),
}));

// ---------------------------------------------------------------------------
// Unit tests for TasksService — framework-agnostic, no Context involved
// ---------------------------------------------------------------------------
//
// These tests call TasksService methods directly to verify that the service
// layer is completely decoupled from Hono. No app.request() is used here.
// ---------------------------------------------------------------------------

const MOCK_TASK = {
	id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
	title: 'Test Task',
	status: 'pending',
	description: null,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// Mock DB layer so service can run without a real database
vi.mock('@/db', () => ({
	getDb: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		query: {
			tasks: {
				findMany: vi.fn().mockResolvedValue([
					{
						...MOCK_TASK,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
				findFirst: vi.fn().mockResolvedValue({
					...MOCK_TASK,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			},
		},
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([
			{
				...MOCK_TASK,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]),
	})),
}));

import { TaskNotFoundError, TasksService } from '../tasks.service';

describe('TasksService — 框架无关单元测试 (Framework-agnostic Unit Tests)', () => {
	it('list() returns paginated items — no Hono Context needed', async () => {
		const result = await TasksService.list({ page: 1, limit: 10 });
		expect(result).toHaveProperty('items');
		expect(result).toHaveProperty('total');
		expect(Array.isArray(result.items)).toBe(true);
	});

	it('getById() returns a single task with ISO date strings', async () => {
		const task = await TasksService.getById(MOCK_TASK.id);
		expect(task.id).toBe(MOCK_TASK.id);
		// Dates should be serialized as ISO strings, not Date objects
		expect(typeof task.createdAt).toBe('string');
		expect(typeof task.updatedAt).toBe('string');
	});

	it('create() returns the newly created task', async () => {
		const task = await TasksService.create({
			title: 'New Task',
			status: 'pending',
		});
		expect(task).toHaveProperty('id');
		expect(task.title).toBe('Test Task'); // mock returns MOCK_TASK
	});

	it('TaskNotFoundError has the correct task ID in the message', () => {
		const err = new TaskNotFoundError('bad-id');
		expect(err.message).toContain('bad-id');
		expect(err.name).toBe('TaskNotFoundError');
	});
});

// ---------------------------------------------------------------------------
// Integration smoke tests — verify full HTTP stack via app.request()
// ---------------------------------------------------------------------------

vi.mock('../tasks.service', () => ({
	TasksService: {
		list: vi.fn().mockResolvedValue({ items: [MOCK_TASK], total: 1 }),
		getById: vi.fn().mockResolvedValue(MOCK_TASK),
		create: vi.fn().mockResolvedValue({ ...MOCK_TASK, title: 'New Task' }),
		update: vi.fn().mockResolvedValue(MOCK_TASK),
		remove: vi.fn().mockResolvedValue(undefined),
	},
	TaskNotFoundError: class TaskNotFoundError extends Error {
		constructor(id: string) {
			super(`Task with id ${id} not found`);
			this.name = 'TaskNotFoundError';
		}
	},
}));

import app from '@/app';

const mockEnv = {
	DATABASE_URL: 'http://localhost:5432/db',
	BETTER_AUTH_URL: 'http://localhost:3000',
	BETTER_AUTH_SECRET: 'secret',
	NODE_ENV: 'test',
};

describe('Tasks HTTP 冒烟测试 (Smoke tests)', () => {
	it('GET /api/v1/tasks → 200 + paginated envelope', async () => {
		const res = await app.request('/api/v1/tasks', { method: 'GET' }, mockEnv);
		expect(res.status).toBe(200);
		const body = (await res.json()) as Record<string, unknown>;
		expect(body.success).toBe(true);
	});

	it('POST /api/v1/tasks → 201 + created task', async () => {
		const res = await app.request(
			'/api/v1/tasks',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'New Task', status: 'pending' }),
			},
			mockEnv
		);
		expect(res.status).toBe(201);
		const body = (await res.json()) as Record<string, unknown>;
		expect(body.success).toBe(true);
	});
});
