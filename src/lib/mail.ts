import nodemailer from "nodemailer";
import { env } from "@/env";

export interface MailProvider {
	sendMail(to: string, subject: string, body: string): Promise<void>;
}

export class NodemailerMailProvider implements MailProvider {
	private readonly transporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS,
		},
	});

	async sendMail(to: string, subject: string, body: string): Promise<void> {
		await this.transporter.sendMail({
			from: env.SMTP_FROM,
			to,
			subject,
			html: body,
		});
	}
}
