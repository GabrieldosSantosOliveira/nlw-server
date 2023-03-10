import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate } from '../plugins/authenticate';

export const guessRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/guesses/count',
    {
      schema: {
        tags: ['guess'],
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
      const count = await prisma.guess.count();
      return { count };
    },
  );
  fastify.post(
    '/pools/:poolId/games/:gameId/guesses',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['pool'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        params: {
          type: 'object',
          properties: {
            poolId: {
              type: 'string',
              description: 'id of poll',
            },
            gameId: {
              type: 'string',
              description: 'id of game',
            },
          },
        },
        response: {
          201: {
            type: 'null',
            description: 'Success',
          },
          400: {
            type: 'object',
            description: 'You already sent a guess to this game on this pool',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            description:
              'You are not allowed to create a guess inside this post',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const createGuessParams = z.object({
        poolId: z.string(),
        gameId: z.string(),
      });
      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number(),
      });
      const { poolId, gameId } = createGuessParams.parse(request.params);
      const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(
        request.body,
      );

      const participant = await prisma.participant.findUnique({
        where: {
          userId_poolId: {
            userId: request.user.sub,
            poolId,
          },
        },
      });
      if (!participant) {
        return reply.status(404).send({
          message: 'You are not allowed to create a guess inside this post',
        });
      }
      const guess = await prisma.guess.findUnique({
        where: {
          gameId_participantId: {
            gameId,
            participantId: participant.id,
          },
        },
      });
      if (guess) {
        return reply.status(400).send({
          message: 'You already sent a guess to this game on this pool',
        });
      }
      const game = await prisma.game.findUnique({
        where: {
          id: gameId,
        },
      });
      if (!game) {
        return reply.status(404).send({
          message: 'Game not found',
        });
      }
      if (game.date < new Date()) {
        return reply.status(400).send({
          message: 'You cannot send guesses after the game date.',
        });
      }
      await prisma.guess.create({
        data: {
          firstTeamPoints,
          secondTeamPoints,
          participantId: participant.id,
          gameId,
        },
      });
      return reply.status(201).send();
    },
  );
};
