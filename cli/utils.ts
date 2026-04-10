import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { logger } from '../src/lib/logger';

/**
 * Ensures the target directory exists, creating it if necessary.
 */
export function ensureDirectoryExistence(filePath: string): boolean {
	const dir = dirname(filePath);
	if (existsSync(dir)) {
		return true;
	}
	ensureDirectoryExistence(dir);
	mkdirSync(dir);
	return true;
}

/**
 * Creates a file with the given content if it does not already exist, or if force is true.
 */
export function createFile(filePath: string, content: string, force = false) {
	ensureDirectoryExistence(filePath);
	if (existsSync(filePath) && !force) {
		return false;
	}
	writeFileSync(filePath, content, 'utf8');
	logger.info(`Created ${filePath}`);
	return true;
}

/**
 * Deletes a directory and all its contents.
 */
export function deleteDirectory(dirPath: string) {
	if (existsSync(dirPath)) {
		rmSync(dirPath, { recursive: true, force: true });
		return true;
	}
	return false;
}

/**
 * Converts a string to PascalCase (e.g. 'article-comments' -> 'ArticleComments')
 */
export function toPascalCase(str: string) {
	return str
		.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
		.replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Converts a string to camelCase (e.g. 'article-comments' -> 'articleComments')
 */
export function toCamelCase(str: string) {
	return str
		.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
		.replace(/^(.)/, (c) => c.toLowerCase());
}
