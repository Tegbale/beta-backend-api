import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: process.env.NODE_ENV !== 'production',

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  clientOrigins: (process.env.CLIENT_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')),

  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, ''),

  email: {
    smtpHost: process.env.SMTP_HOST ?? 'smtp.mailgun.org',
    smtpPort: parseInt(process.env.SMTP_PORT ?? '465', 10),
    smtpSecure: process.env.SMTP_SECURE !== 'false',
    smtpUser: required('SMTP_USER'),
    smtpPass: required('SMTP_PASS'),
    from: process.env.EMAIL_FROM ?? 'noreply@tegbale.com',
    superadminEmail: process.env.SUPERADMIN_EMAIL ?? 'superadmin@tegbale.com',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'cloudinary',
    spaces: {
      key: process.env.DO_SPACES_KEY ?? '',
      secret: process.env.DO_SPACES_SECRET ?? '',
      bucket: process.env.DO_SPACES_BUCKET ?? '',
      region: process.env.DO_SPACES_REGION ?? 'nyc3',
    },
  },
};
