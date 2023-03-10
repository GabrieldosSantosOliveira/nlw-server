import { FastifyInstance } from 'fastify';

import { prisma } from '../lib/prisma';

export const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/users/count',
    {
      schema: {
        tags: ['user'],
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
          },
        },
      },
    },
    async () => {
      const count = await prisma.user.count();
      return { count };
    },
  );
};
