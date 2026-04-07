import { describe, expect, it, vi } from 'vitest';

vi.mock('@neondatabase/serverless', () => ({
	neon: vi.fn().mockImplementation(() => {
		return () => {};
	}),
}));

// Mock TasksService BEFORE importing app
vi.mock('../tasks.service', () => {
	const mockTasks = [
		{
			id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
			title: 'Test Task',
			status: 'pending',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	return {
		TasksService: {
			list: vi.fn().mockResolvedValue({
				items: mockTasks,
				total: 1,
			}),
			getById: vi.fn().mockResolvedValue(mockTasks[0]),
			create: vi.fn().mockResolvedValue({
				id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
				title: 'New Task',
				status: 'pending',
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			update: vi.fn(),
			remove: vi.fn(),
		},
	};
});

// Now import app
import app from '@/app';

describe('Tasks Module', () => {
	const mockEnv = {
		DATABASE_URL: 'http://localhost:5432/db',
		BETTER_AUTH_URL: 'http://localhost:3000',
		BETTER_AUTH_SECRET: 'secret',
		NODE_ENV: 'test',
	};

	it('GET /tasks returns 200 and paginated list', async () => {
		const res = await app.request(
			'/api/v1/tasks',
			{
				method: 'GET',
			},
			mockEnv
		);

		if (res.status !== 200) {
			console.log('Error details:', await res.text());
		}
		expect(res.status).toBe(200);
		const body = (await res.json()) as any;
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data.items)).toBe(true);
		expect(body.data.items[0].title).toBe('Test Task');
		expect(body.data.meta.total).toBe(1);
	});

	it('POST /tasks returns 201 and created task', async () => {
		const res = await app.request(
			'/api/v1/tasks',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'New Task',
					description: 'Desc',
					status: 'pending',
				}),
			},
			mockEnv
		);

		expect(res.status).toBe(201);
		const body = (await res.json()) as any;
		expect(body.success).toBe(true);
		expect(body.data.title).toBe('New Task');
	});
});
