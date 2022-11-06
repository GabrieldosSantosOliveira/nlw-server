import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import Fastify from 'fastify';
import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';

import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { guessRoutes } from './routes/guess';
import { poolRoutes } from './routes/pool';
import { userRoutes } from './routes/user';
config();
const prisma = new PrismaClient({
  log: ['query']
});
async function bootstrap() {
  const fastify = Fastify({
    logger: true
  });
  await fastify.register(cors, { origin: true });
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET as string
  });
  fastify.register(poolRoutes);
  fastify.register(userRoutes);
  fastify.register(guessRoutes);
  fastify.register(authRoutes);
  fastify.register(gameRoutes);

  await fastify.listen({ port: 3333 });
}
bootstrap();
