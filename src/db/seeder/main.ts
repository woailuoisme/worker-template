process.loadEnvFile('.env');

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DatabaseSeeder } from '@/db/seeder/index';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined in .env');
}

// =========================================================================
// 3. 运行环境 Bootstrap
// =========================================================================
async function main() {
	const databaseUrl = process.env.DATABASE_URL as string;
	const sql = neon(databaseUrl);
	const db = drizzle(sql);

	try {
		// 实例化首个主干 Seeder 交由内部调度
		const seeder = new DatabaseSeeder(db);
		await seeder.run();
	} catch (_error) {
		process.exit(1);
	}
}

void main();
