/** @jsxImportSource hono/jsx */
import type { Child } from 'hono/jsx';

/**
 * Common layout for all transactional emails
 */
export const EmailLayout = ({
	title,
	preheader,
	children,
	appName,
}: {
	title: string;
	preheader?: string;
	children: Child;
	appName: string;
}) => (
	<html lang="zh-CN">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
			<title>{title}</title>
		</head>
		<body
			style={{
				backgroundColor: '#f8fafc',
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
				WebkitFontSmoothing: 'antialiased',
				fontSize: '16px',
				lineHeight: '1.5',
				color: '#334155',
				width: '100% !important',
				height: '100% !important',
				margin: 0,
				padding: 0,
			}}
		>
			<span
				style={{
					display: 'none !important',
					visibility: 'hidden',
					opacity: 0,
					color: 'transparent',
					height: 0,
					width: 0,
				}}
			>
				{preheader}
			</span>

			<table
				role="presentation"
				border={0}
				cellPadding="0"
				cellSpacing="0"
				width="100%"
				style={{ backgroundColor: '#f8fafc' }}
			>
				<tr>
					<td align="center" style={{ padding: '40px 10px' }}>
						<table
							role="presentation"
							border={0}
							cellPadding="0"
							cellSpacing="0"
							width="100%"
							style={{
								maxWidth: '600px',
								backgroundColor: '#ffffff',
								borderRadius: '12px',
								boxShadow:
									'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
							}}
						>
							<tr>
								<td style={{ padding: '40px 32px' }}>
									{children}

									<hr
										style={{
											margin: '32px 0',
											border: 'none',
											borderTop: '1px solid #f1f5f9',
										}}
									/>

									<p
										style={{
											margin: 0,
											textAlign: 'center',
											color: '#94a3b8',
											fontSize: '12px',
										}}
									>
										如果您未请求此操作，请忽略此邮件。
										<br />
										为了安全起见，请勿将验证码泄露给他人。
									</p>
								</td>
							</tr>
						</table>

						<table
							role="presentation"
							border={0}
							cellPadding="0"
							cellSpacing="0"
							width="100%"
							style={{ maxWidth: '600px', marginTop: '24px' }}
						>
							<tr>
								<td
									style={{
										textAlign: 'center',
										color: '#94a3b8',
										fontSize: '12px',
									}}
								>
									Sent by <strong>{appName}</strong>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
	</html>
);
