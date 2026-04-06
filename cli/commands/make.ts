import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { logger } from '../../src/lib/logger';
import {
	createFile,
	deleteDirectory,
	toCamelCase,
	toPascalCase,
} from '../utils';

export function setupMakeCommand(program: Command) {
	program
		.command('make:module <name>')
		.description(
			'Creates a new domain module (routes, handlers, service, index)'
		)
		.option('-f, --force', 'Force overwrite existing files')
		.option(
			'-d, --delete',
			'Delete the module directory instead of creating it'
		)
		.action((name: string, options: { force?: boolean; delete?: boolean }) => {
			const moduleName = name.toLowerCase();
			const pascalName = toPascalCase(moduleName);
			const camelName = toCamelCase(moduleName);
			const baseDir = join(process.cwd(), 'src', 'modules', moduleName);

			if (options.delete) {
				const deleted = deleteDirectory(baseDir);
				if (deleted) {
					logger.info(
						`Module ${moduleName} removed from src/modules/${moduleName}/`
					);
				} else {
					logger.warn(
						`Module ${moduleName} not found at src/modules/${moduleName}/`
					);
				}
				return;
			}

			logger.info(`Generating module: ${moduleName}...`);

			function generateFromStub(stubName: string, destName: string) {
				const stubPath = join(process.cwd(), 'cli', 'stubs', stubName);
				const destPath = join(baseDir, destName);

				let content = readFileSync(stubPath, 'utf8');
				content = content.replace(/\{\{ModuleName\}\}/g, moduleName);
				content = content.replace(/\{\{PascalName\}\}/g, pascalName);
				content = content.replace(/\{\{CamelName\}\}/g, camelName);

				createFile(destPath, content, options.force);
			}

			// 1. service.ts
			generateFromStub('module.service.stub', `${moduleName}.service.ts`);
			// 2. handlers.ts
			generateFromStub('module.handlers.stub', `${moduleName}.handlers.ts`);
			// 3. routes.ts
			generateFromStub('module.routes.stub', `${moduleName}.routes.ts`);
			// 4. index.ts
			generateFromStub('module.index.stub', `${moduleName}.index.ts`);

			logger.info(
				`Module ${moduleName} generated at src/modules/${moduleName}/`
			);
			logger.info(
				`To integrate, add the following to src/app.ts:\nimport {{ ${camelName}Router }} from '@/modules/${moduleName}/${moduleName}.index';\napp.route('/${moduleName}', ${camelName}Router);`
			);
		});
}
