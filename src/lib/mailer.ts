import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransporter() {
  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.username,
      pass: env.email.password,
    },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  await transporter.sendMail({ from: env.email.from, to, subject, html });
}

export async function verifySmtp(): Promise<true> {
  return createTransporter().verify();
}
