import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  auth: {
    user: env.email.username,
    pass: env.email.password,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: env.email.from, to, subject, html });
}
