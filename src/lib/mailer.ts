import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransport() {
  return nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  await createTransport().sendMail({
    from: `Tègbalé <${env.email.from}>`,
    to,
    subject,
    html,
  });
}

export async function verifySmtp(): Promise<true> {
  await createTransport().verify();
  return true;
}