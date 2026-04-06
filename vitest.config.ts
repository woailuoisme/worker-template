import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	root: __dirname,

	test: {
		include: ['tests/**/*.(test|spec).(ts|tsx)', 'src/**/*.test.(ts|tsx)'],
		environment: 'node',
		hookTimeout: 30000,

		// Coverage disabled by default, enable with --coverage
		coverage: {
			enabled: false,
			provider: 'v8',
		},

		// Reporters
		reporters: ['default', 'json', 'junit'],
		outputFile: {
			json: './test-results/results.json',
			junit: './test-results/results.xml',
		},

		// Mock cleanup
		clearMocks: true,
		restoreMocks: true,

		// Use default pool (no custom config)
	},

	// Vite resolve - match tsconfig.json
	resolve: {
		conditions: ['node'],
		alias: [
			{
				find: '@',
				replacement: `${path.resolve(__dirname, 'src')}/`,
			},
			{
				find: '~',
				replacement: `${__dirname}/`,
			},
		],
	},

	// Build target
	esbuild: {
		target: 'es2022',
	},

	// Miniflare setup is handled per-test via Miniflare directly.
});
