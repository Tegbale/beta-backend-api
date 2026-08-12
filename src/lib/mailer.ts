import { env } from '../config/env';

export async function sendMail(to: string, subject: string, html: string) {
  const form = new FormData();
  form.append('from', `Tegbale <${env.mailgun.from}>`);
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', html);

  const credentials = Buffer.from(`api:${env.mailgun.apiKey}`).toString('base64');

  const res = await fetch(
    `https://api.mailgun.net/v3/${env.mailgun.domain}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
      body: form,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailgun ${res.status}: ${text}`);
  }
}
