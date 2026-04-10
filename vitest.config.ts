import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		/* 核心路径 */
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],

		/* 运行环境 */
		environment: 'node',
		globals: false, // 鼓励显示导入 (describe, it, expect) 以获得更好的 IDE 支持

		/* 自动化清理 (极简版) */
		clearMocks: true,
		restoreMocks: true,
		mockReset: false,

		/* 报告器与 CI 适配 */
		reporters: ['default', 'json', 'junit'],
		outputFile: {
			json: './test-results/results.json',
			junit: './test-results/results.xml',
		},

		/* 覆盖率配置 */
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['cli/**', 'tests/**'],
		},

		/* 超时设置 */
		hookTimeout: 30000,
		testTimeout: 10000,
	},

	/* 别名解析 — 保持与 tsconfig 一致 */
	resolve: {
		alias: {
			'@': new URL('./src', import.meta.url).pathname,
			'~': new URL('.', import.meta.url).pathname,
		},
	},

	/* 构建优化 */
	esbuild: {
		target: 'esnext',
	},
});
