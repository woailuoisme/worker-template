import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { confirm, input } from '@inquirer/prompts';
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
		// 将 <name> 改为 [name] 使其可选，为交互式输入留出空间
		.command('make:module [name]')
		.description(
			'Creates a new domain module (routes, handlers, service, index) interactively'
		)
		.option(
			'-f, --force',
			'Force overwrite existing files or bypass delete confirmation'
		)
		.option(
			'-d, --delete',
			'Delete the module directory instead of creating it'
		)
		.action(
			async (
				nameParam: string | undefined,
				options: { force?: boolean; delete?: boolean }
			) => {
				// 1. 如果没有传入 name，则使用 inquirer 提问
				const name =
					nameParam ||
					(await input({
						message: options.delete
							? 'What is the name of the module to delete?'
							: 'What is the name of your new module?',
						validate: (value) =>
							value.trim().length > 0 || 'Module name is required',
					}));

				const moduleName = name.trim().toLowerCase();
				const pascalName = toPascalCase(moduleName);
				const camelName = toCamelCase(moduleName);
				const baseDir = join(process.cwd(), 'src', 'modules', moduleName);

				// 2. 模块删除逻辑 (加入交互式确认)
				if (options.delete) {
					// 除非带了 --force，否则二次确认
					if (!options.force) {
						const proceed = await confirm({
							message: `Are you sure you want to permanently delete the module '${moduleName}'?`,
							default: false,
						});
						if (!proceed) {
							logger.info('Deletion aborted.');
							return;
						}
					}

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

				// 3. 模块生成逻辑
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
					`To integrate, add the following to src/app.ts:\nimport { ${camelName}Router } from '@/modules/${moduleName}/${moduleName}.index';\napp.route('/api/v1/${moduleName}', ${camelName}Router);`
				);
			}
		);
}
