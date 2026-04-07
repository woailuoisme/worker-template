/** @jsxImportSource hono/jsx */
import { EmailLayout } from '../components/email-layout';

/**
 * OTP / Validation Email Template
 */
export const TemplateOTP = ({
	otp,
	title = '验证您的身份',
	appName,
}: {
	otp: string;
	title?: string;
	appName: string;
}) => (
	<EmailLayout
		title={title}
		preheader={`您的验证码是 ${otp}. 有效期 10 分钟。`}
		appName={appName}
	>
		<h1
			style={{
				margin: '0 0 24px',
				fontSize: '24px',
				fontWeight: 'bold',
				color: '#0f172a',
				textAlign: 'center',
			}}
		>
			{title}
		</h1>

		<p style={{ margin: '0 0 24px', textAlign: 'center', color: '#475569' }}>
			完成请求，请使用以下一次性支付验证码 (OTP)：
		</p>

		<div style={{ textAlign: 'center', margin: '32px 0' }}>
			<div
				style={{
					display: 'inline-block',
					fontFamily:
						"ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace",
					fontSize: '36px',
					fontWeight: 'bold',
					letterSpacing: '0.25em',
					padding: '16px 32px',
					backgroundColor: '#f1f5f9',
					color: '#1e293b',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				{otp}
			</div>
		</div>

		<p
			style={{
				margin: '24px 0 0',
				textAlign: 'center',
				color: '#64748b',
				fontSize: '14px',
			}}
		>
			该验证码将在 <strong>10 分钟</strong> 内失效。
		</p>
	</EmailLayout>
);
