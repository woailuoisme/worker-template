import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['tests/**/*.test.ts'],
	project: ['src/**/*.ts', 'cli/**/*.ts', 'tests/**/*.ts'],
};

export default config;
