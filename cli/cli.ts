import { Command } from 'commander';
import { initLogger } from '../src/lib/logger';
import { setupMakeCommand } from './commands/make';

await initLogger('info');

const program = new Command();

program
	.name('cli')
	.description('Custom Worker Template Artisan-style CLI')
	.version('1.0.0');

// Register modular commands
setupMakeCommand(program);

program.parse(process.argv);
