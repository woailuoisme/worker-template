import { createDb } from '@/db';
import { DatabaseSeeder } from '@/db/seeder/index';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined in .env');
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL as string;
	const db = createDb(databaseUrl);

	try {
		const seeder = new DatabaseSeeder(db);
		await seeder.run();
	} catch (_error) {
		process.exit(1);
	}
}

void main();
