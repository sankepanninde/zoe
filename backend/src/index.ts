import 'dotenv/config'; // <-- ESTA LÍNEA ES LA QUE FALTA
import { buildApp } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const app = await buildApp();

const shutdown = async (signal: string) => {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  try {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error cerrando servidor');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`🚀 Zoe backend corriendo en http://${env.HOST}:${env.PORT}`);
  logger.info(`   Entorno: ${env.NODE_ENV}`);
} catch (error) {
  logger.error({ err: error }, 'Error arrancando servidor');
  process.exit(1);
}