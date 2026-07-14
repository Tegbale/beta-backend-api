import {createServer} from 'http';
import app from './app';
import {env} from './config/env';
import {logger} from './utils/logger';
import {prisma} from './lib/prisma';
import {initGateway} from './gateway';

const httpServer = createServer(app);

initGateway(httpServer);

let isShuttingDown = false;

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

const shutdown = (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
        logger.warn('Shutdown already in progress...');
        return;
    }

    isShuttingDown = true;

    logger.info(`Received ${signal}. Shutting down gracefully...`);

    const forceShutdown = setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);

    httpServer.close(async (err) => {
        if (err) {
            logger.error('Error closing HTTP server', err);
            clearTimeout(forceShutdown);
            process.exit(1);
        }

        logger.info('HTTP server closed.');

        try {
            await prisma.$disconnect();
            logger.info('Database disconnected.');

            clearTimeout(forceShutdown);
            process.exit(0);
        } catch (err) {
            logger.error('Error disconnecting Prisma', err);
            clearTimeout(forceShutdown);
            process.exit(1);
        }
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', reason);
    shutdown('SIGTERM');
});

void start();