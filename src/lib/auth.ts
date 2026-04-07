import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
	admin,
	bearer,
	jwt,
	magicLink,
	openAPI,
	username,
} from 'better-auth/plugins';
import { createDb } from '@/db';
import type { Env } from '@/env';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { TemplateActionLink } from '@/resources/email/email-templates';

/**
 * Custom options for Better Auth
 */
export const betterAuthOptions: BetterAuthOptions = {
	basePath: '/api/auth',
};

interface ExecutionContext {
	waitUntil(promise: Promise<any>): void;
}

/**
 * Better Auth Instance
 */
export const auth = (env: Env, ctx?: ExecutionContext) => {
	const db = createDb(env.DATABASE_URL);

	return betterAuth({
		...betterAuthOptions,
		appName: env.APP_NAME,
		database: drizzleAdapter(db, { provider: 'pg' }),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		plugins: [
			/** 自动生成所有认证接口的 OpenAPI 规范，实现 API 文档自动同步。 */
			openAPI(),
			/** 启用基于 JSON Web Token 的无状态会话处理。 */
			jwt(),
			/** 支持通过请求头中的 Bearer Token 进行认证（Authorization: Bearer <token>）。 */
			bearer(),
			/** 允许用户通过唯一的用户名进行登录和身份识别。 */
			username(),
			/** 支持魔术链接登录。 */
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await sendEmail(env, {
						to: email,
						subject: `Sign in to ${env.APP_NAME}`,
						html: (
							TemplateActionLink({
								title: 'Secure Sign In',
								actionText:
									'Please click the button below to securely sign in to your account.',
								url,
								appName: env.APP_NAME,
							}) as any
						).toString(),
					});
				},
			}),

			/**
			 * 管理员功能 (Admin)
			 * 提供管理员专用的 API 接口，用于后台管理操作，如：
			 * - 禁用/启用用户
			 * - 强制清除用户会话
			 * - 更改用户权限角色
			 */
			admin(),
			/* --- 待启用的推荐插件 --- */
			/** 双重身份验证 (2FA) */
			// twoFactor(),
			/**
			 * 组织与团队管理 (Organization)
			 * 开启多租户或团队协作能力，支持：
			 * - 团队/组织的创建与解散
			 * - 成员邀请与审核流程
			 * - 基于组织的权限控制 (RBAC)
			 */
			// organization(),
		],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			async sendResetPassword({ user, url }) {
				await sendEmail(env, {
					to: user.email,
					subject: `Reset your password - ${env.APP_NAME}`,
					html: (
						TemplateActionLink({
							title: 'Reset Password',
							actionText:
								'We received a request to reset your password. Click the button below to set a new one:',
							url,
							appName: env.APP_NAME,
						}) as any
					).toString(),
				});
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			async sendVerificationEmail({ user, url }) {
				await sendEmail(env, {
					to: user.email,
					subject: `Verify your email address - ${env.APP_NAME}`,
					html: (
						TemplateActionLink({
							title: 'Verify Your Email Address',
							actionText:
								'Welcome! Please verify your email address to complete your account setup by clicking the button below:',
							url,
							appName: env.APP_NAME,
						}) as any
					).toString(),
				});
			},
		},
		advanced: {
			backgroundTasks: {
				handler: (promise) => {
					if (ctx?.waitUntil) {
						ctx.waitUntil(promise);
					} else {
						// For CLI or other non-worker environments, just log errors
						void promise.catch((err) => {
							logger.error('Better Auth background task failed', {
								error: err,
							});
						});
					}
				},
			},
		},

		// --- Security Optimizations ---

		/**
		 * Rate limiting storage and rules.
		 * Use "database" for persistence in serverless environments.
		 */
		rateLimit: {
			enabled: true,
			storage: 'database',
			customRules: {
				'/api/auth/sign-in/email': { window: 60, max: 5 },
				'/api/auth/sign-up/email': { window: 60, max: 3 },
			},
		},

		/**
		 * Better session and cookie security.
		 */
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 24 hours
			freshAge: 60 * 60, // 1 hour for high-security actions
			cookieCache: {
				enabled: true,
				maxAge: 300, // 5 minutes
				strategy: 'compact', // Compact is best for cookie size limits
			},
		},

		/**
		 * Provider security hardening.
		 */
		account: {
			encryptOAuthTokens: true,
		},

		/**
		 * Security Audit Logging via Database Hooks
		 */
		databaseHooks: {
			user: {
				create: {
					after: async ({ data }) => {
						const u = data as { id: string; email: string };
						logger.info('Audit: User registered', {
							userId: u.id,
							email: u.email,
						});
					},
				},
				delete: {
					after: async ({ data }) => {
						const u = data as { id: string };
						logger.info('Audit: User deleted', { userId: u.id });
					},
				},
			},
			session: {
				create: {
					after: async ({ data }) => {
						const s = data as { userId: string };
						logger.info('Audit: Session created', { userId: s.userId });
					},
				},
			},
		},
	});
};
