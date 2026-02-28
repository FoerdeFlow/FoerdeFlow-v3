import nodemailer from 'nodemailer'

export async function sendMail(message: {
	to: string
	subject: string
	text: string
	replyTo?: string
	attachments?: {
		filename: string
		content: Buffer
	}[]
}) {
	const runtimeConfig = useRuntimeConfig()

	const transporter = nodemailer.createTransport({
		host: runtimeConfig.mail.host,
		auth: {
			user: runtimeConfig.mail.username,
			pass: runtimeConfig.mail.password,
		},
		tls: {
			rejectUnauthorized: import.meta.dev ? false : true,
		},
	})

	await transporter.sendMail({
		from: runtimeConfig.mail.from,
		replyTo: message.replyTo,
		to: message.to,
		subject: message.subject,
		text: message.text + '\n\n-- \nDiese E-Mail wurde automatisch generiert.',
		attachments: message.attachments || [],
	})
}