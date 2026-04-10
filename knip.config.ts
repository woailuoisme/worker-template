import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['src/**/__tests__/**/*.test.ts'],
	project: ['src/**/*.ts', 'cli/**/*.ts'],
	ignoreExportsUsedInFile: true,
	ignore: ['src/lib/**/*.ts', 'src/factory.ts'],
};

export default config;
