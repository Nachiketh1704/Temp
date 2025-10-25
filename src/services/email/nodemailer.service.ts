import nodemailer from "nodemailer";
import { EmailPayload, EmailProvider } from "./email.interface";
import { env } from "../../config/env";

export class NodemailerService implements EmailProvider {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, from }: EmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: from || env.DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
    });
  }
}
