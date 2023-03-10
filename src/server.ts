import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Swagger from '@fastify/swagger';
import SwaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import Fastify from 'fastify';

import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { guessRoutes } from './routes/guess';
import { poolRoutes } from './routes/pool';
import { userRoutes } from './routes/user';
config();
async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });
  await fastify.register(cors, { origin: true });
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET as string,
  });
  fastify.register(Swagger, {
    swagger: {
      info: {
        title: 'NLW Copa server',
        version: '1.0.0',
        contact: {
          email: 'gabrielsantosoliveira951@gmail.com',
          url: 'https://www.linkedin.com/in/gabriel-dos-santos-oliveira-24b67b243/',
          name: 'Gabriel dos Santos Oliveira',
        },
        description: 'Aplicação desenvolvida durante a NLW copa',
        license: {
          name: 'MIT',
          url: 'https://github.com/GabrieldosSantosOliveira/nlw-server/blob/master/LICENSE',
        },
      },
      schemes: ['http', 'https'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Formato a ser informado Bearer [token]',
        },
      },
    },
  });
  fastify.register(poolRoutes);
  fastify.register(userRoutes);
  fastify.register(guessRoutes);
  fastify.register(authRoutes);
  fastify.register(gameRoutes);

  fastify.register(SwaggerUi, { prefix: '/docs' });
  await fastify.listen({ port: 3333 });
}
bootstrap();
