import { faker } from '@faker-js/faker';
import type * as schema from '@/db/schema/index';

// =========================================================================
// 1. Factory 核心基类 (Laravel 风格)
// =========================================================================
export abstract class Factory<T> {
	/**
	 * 定义该模型生成的基础默认规则
	 */
	protected abstract definition(): T;

	/**
	 * 生成单条数据
	 * @param overrides 手动覆盖的属性
	 */
	public make(overrides: Partial<T> = {}): T {
		return { ...this.definition(), ...overrides };
	}

	/**
	 * 批量生成数据
	 * @param count 数量
	 * @param overrides 手动覆盖的属性
	 */
	public makeMany(count: number, overrides: Partial<T> = {}): T[] {
		return Array.from({ length: count }).map(() => this.make(overrides));
	}
}

// ------------------------------------------
// 对应实体的具体 Factories
// ------------------------------------------
export class UserFactory extends Factory<typeof schema.user.$inferInsert> {
	protected definition() {
		return {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			emailVerified: faker.datatype.boolean(0.8),
			image: faker.image.avatar(),
			username: faker.internet.username().toLowerCase(),
			displayUsername: faker.internet.displayName(),
			createdAt: faker.date.past(),
			updatedAt: new Date(),
		};
	}
}

export class AccountFactory extends Factory<
	typeof schema.account.$inferInsert
> {
	protected definition() {
		const provider = faker.helpers.arrayElement([
			'github',
			'google',
			'credential',
		]);
		return {
			id: faker.string.uuid(),
			userId: faker.string.uuid(), // 这里的关联 ID 会在 Seeder 中被正确覆盖
			accountId: faker.string.alphanumeric(12),
			providerId: provider,
			accessToken:
				provider !== 'credential' ? faker.string.alphanumeric(32) : null,
			password: provider === 'credential' ? faker.internet.password() : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
