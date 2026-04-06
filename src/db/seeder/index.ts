import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { AccountFactory, UserFactory } from '@/db/factory/index';
import * as schema from '@/db/schema/index';

export type DbClient = NeonHttpDatabase<any>;

// =========================================================================
// 2. Seeder 核心基类 (Laravel 风格)
// =========================================================================
export abstract class Seeder {
	protected db: DbClient;
	constructor(db: DbClient) {
		this.db = db;
	}

	/**
	 * Seeder 的主执行体
	 */
	public abstract run(): Promise<void>;

	/**
	 * 从内部调用其他的 Seeder
	 */
	protected async call(seederClass: new (db: DbClient) => Seeder) {
		const seeder = new seederClass(this.db);
		await seeder.run();
	}
}

// ------------------------------------------
// 对应实体的具体 Seeders
// ------------------------------------------
export class UsersTableSeeder extends Seeder {
	public async run() {
		// 使用 Factory 生成 10 个测试用户
		const fakeUsers = new UserFactory().makeMany(10);
		const insertedUsers = await this.db
			.insert(schema.user)
			.values(fakeUsers)
			.returning();

		// 为新生成的用户匹配生成关联的账户数据
		const accountFactory = new AccountFactory();
		const fakeAccounts = insertedUsers.map(
			(user: (typeof schema.user)['$inferSelect']) =>
				accountFactory.make({ userId: user.id, createdAt: user.createdAt })
		);

		const _insertedAccounts = await this.db
			.insert(schema.account)
			.values(fakeAccounts)
			.returning();
	}
}

// 主 DatabaseSeeder（调度所有具体的 Seeder）
export class DatabaseSeeder extends Seeder {
	public async run() {
		// 你可以在这里决定按什么顺序引入并运行哪些表的 Seeder
		await this.call(UsersTableSeeder);
	}
}
