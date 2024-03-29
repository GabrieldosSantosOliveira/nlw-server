import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate } from '../plugins/authenticate';

export const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/pools/:id/games',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['game'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'id of poll',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        response: {
          200: {
            type: 'object',
            properties: {
              games: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    date: { type: 'string', format: 'datetime' },
                    firstTeamCountryCode: { type: 'string' },
                    secondTeamCountryCode: { type: 'string' },
                    guess: {
                      type: 'object',
                      properties: {
                        createdAt: { type: 'string', format: 'datetime' },
                        firstTeamPoints: { type: 'number' },
                        gameId: { type: 'string' },
                        id: { type: 'string' },
                        participantId: { type: 'string' },
                        secondTeamPoints: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const getPoolParams = z.object({
        id: z.string(),
      });
      const { id } = getPoolParams.parse(request.params);
      const games = await prisma.game.findMany({
        orderBy: {
          date: 'desc',
        },
        include: {
          guesses: {
            where: {
              participant: {
                userId: request.user.sub,
                poolId: id,
              },
            },
          },
        },
      });

      return {
        games: games.map((game) => {
          return {
            ...game,
            guess: game.guesses.length > 0 ? game.guesses[0] : null,
            guesses: undefined,
          };
        }),
      };
    },
  );
};
