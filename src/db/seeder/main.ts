import { seed } from 'drizzle-seed';
import { createDb } from '@/db';
import * as schema from '@/db/schema/index';
import { logger } from '@/lib/logger';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined in .env');
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL as string;
	const db = createDb(databaseUrl);

	logger.info('🌱 Starting database seeding with drizzle-seed...');
	try {
		// 使用 drizzle-seed 根据 schema 智能生成测试数据
		// 这将自动处理所有外键关系、顺序和数据类型
		await seed(db, schema, { count: 15 }).refine((f) => ({
			user: {
				columns: {
					role: f.valuesFromArray({ values: ['user', 'admin'] }),
					email: f.email(),
					image: f.valuesFromArray({
						values: ['https://github.com/shadcn.png', undefined],
					}),
				},
			},
			tasks: {
				columns: {
					status: f.valuesFromArray({
						values: ['pending', 'in_progress', 'completed'],
					}),
				},
			},
		}));

		logger.info('✅ Database fully seeded successfully!');
	} catch (error) {
		logger.error(
			`❌ Seeding failed: ${error instanceof Error ? error.message : String(error)}`
		);
		process.exit(1);
	}
}

void main();
