import { describe, expect, it, vi } from 'vitest';

// Mock TasksService BEFORE importing app
vi.mock('../tasks.service', () => {
	class MockTasksService {
		getTasks = vi.fn().mockResolvedValue([
			{
				id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
				title: 'Test Task',
				status: 'pending',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		getTaskById = vi.fn();
		createTask = vi.fn().mockResolvedValue({
			id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
			title: 'New Task',
			status: 'pending',
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		updateTask = vi.fn();
		deleteTask = vi.fn();
	}
	return { TasksService: MockTasksService };
});

// Now import app
import app from '@/app';

describe('Tasks Module', () => {
	it('GET /tasks returns 200 and list', async () => {
		const res = await app.request(
			'/tasks',
			{
				method: 'GET',
			},
			{
				DATABASE_URL: 'dummy-url',
			}
		);

		if (res.status === 500) {
			console.log('Error 500 details:', await res.text());
		}

		expect(res.status).toBe(200);
		const data = (await res.json()) as any;
		expect(Array.isArray(data)).toBe(true);
		expect(data[0].title).toBe('Test Task');
	});

	it('POST /tasks returns 201 and created task', async () => {
		const res = await app.request(
			'/tasks',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'New Task',
					description: 'Desc',
					status: 'pending',
				}),
			},
			{
				DATABASE_URL: 'dummy-url',
			}
		);

		expect(res.status).toBe(201);
		const data = (await res.json()) as any;
		expect(data.title).toBe('New Task');
	});
});
