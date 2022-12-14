import { FastifyInstance } from 'fastify';
import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate } from '../plugins/authenticate';

export const poolRoutes = async (
  fastify: FastifyInstance
) => {
  fastify.get('/pools/count', async () => {
    const count = await prisma.pool.count();
    return { count };
  });
  fastify.post('/pools', async (request, reply) => {
    const createPollBody = z.object({
      title: z.string()
    });
    const { title } = createPollBody.parse(request.body);
    const generate = new ShortUniqueId({ length: 6 });
    const code = String(generate()).toUpperCase();
    const ownerId = null;

    try {
      await request.jwtVerify();
      await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub
            }
          }
        }
      });
    } catch {
      await prisma.pool.create({
        data: {
          title,
          code
        }
      });
    }

    return reply.status(201).send({ code });
  });
  fastify.post(
    '/pools/join',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const joinPoolBody = z.object({
        code: z.string()
      });
      const { code } = joinPoolBody.parse(request.body);
      const pool = await prisma.pool.findUnique({
        where: {
          code
        },
        include: {
          participants: {
            where: {
              userId: request.user.sub
            }
          }
        }
      });
      if (!pool) {
        return reply
          .status(404)
          .send({ error: 'Pool not found' });
      }
      if (pool.participants.length > 0) {
        return reply
          .status(400)
          .send({ error: 'Already joined this pool' });
      }
      if (!pool.ownerId) {
        await prisma.pool.update({
          where: {
            id: pool.id
          },
          data: {
            ownerId: request.user.sub
          }
        });
      }
      await prisma.participant.create({
        data: {
          userId: request.user.sub,
          poolId: pool.id
        }
      });
      return reply.status(201).send();
    }
  );
  fastify.get(
    '/pools',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const pools = await prisma.pool.findMany({
        where: {
          participants: {
            some: {
              userId: request.user.sub
            }
          }
        },
        include: {
          _count: {
            select: {
              participants: true
            }
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true
                }
              }
            },
            take: 4
          },
          owner: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });
      return { pools };
    }
  );
  fastify.get(
    '/pools/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const getPoolParams = z.object({
        id: z.string()
      });
      const { id } = getPoolParams.parse(request.params);
      const pool = await prisma.pool.findFirst({
        where: {
          id
        },
        include: {
          _count: {
            select: {
              participants: true
            }
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true
                }
              }
            },
            take: 4
          },
          owner: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });
      return { pool };
    }
  );
};
