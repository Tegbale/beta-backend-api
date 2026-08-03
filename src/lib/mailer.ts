import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransport() {
  return nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: false,
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPass,
    },
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