import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { initGateway } from './gateway';

const httpServer = createServer(app);
initGateway(httpServer);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    httpServer.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

start();
