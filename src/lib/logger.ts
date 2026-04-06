import {
	configure,
	getConsoleSink,
	getLevelFilter,
	getLogger,
	type LogLevel,
	type Logger as LogtapeLogger,
} from '@logtape/logtape';

let configured = false;

/**
 * 初始化 Logtape 日志记录器配置（应用启动时调用一次）
 */
export async function initLogger(level: LogLevel = 'info') {
	if (configured) {
		return;
	}

	await configure({
		sinks: {
			console: getConsoleSink(),
		},
		filters: {
			levelFilter: getLevelFilter(level),
			metaFilter: getLevelFilter('warning'),
		},
		loggers: [
			{
				category: ['logtape', 'meta'],
				sinks: ['console'],
				filters: ['metaFilter'],
			},
			{
				category: ['app'],
				sinks: ['console'],
				filters: ['levelFilter'],
			},
		],
	});
	configured = true;
}

/**
 * 获取指定子分类的 Logger 实例
 * @example getAppLogger(['app', 'database'])
 */
export function getAppLogger(
	category: string | string[] = 'app'
): LogtapeLogger {
	const cat = Array.isArray(category) ? category : [category];
	return getLogger(cat);
}

// ==========================================
// 快捷方法：直接使用默认的 'app' logger
// ==========================================
const defaultLogger = () => getLogger(['app']);

type LogProps = Record<string, unknown>;

export const logger = {
	debug: (message: string, props?: LogProps) =>
		defaultLogger().debug(message, props),
	info: (message: string, props?: LogProps) =>
		defaultLogger().info(message, props),
	warn: (message: string, props?: LogProps) =>
		defaultLogger().warn(message, props),
	error: (message: string, props?: LogProps) =>
		defaultLogger().error(message, props),
	fatal: (message: string, props?: LogProps) =>
		defaultLogger().fatal(message, props),
} as const;
