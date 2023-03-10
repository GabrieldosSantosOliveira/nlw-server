import axios from 'axios';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate } from '../plugins/authenticate';
export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/users',
    {
      schema: {
        tags: ['user'],
        body: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
            },
          },
        },
      },
    },
    async (request) => {
      const createUserBody = z.object({
        access_token: z.string(),
      });
      const { access_token } = createUserBody.parse(request.body);
      const userResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      const userData = await userResponse.data;
      const userInfoSchema = z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string(),
        picture: z.string().url(),
      });
      const userInfo = userInfoSchema.parse(userData);
      let user = await prisma.user.findUnique({
        where: {
          googleId: userInfo.id,
        },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.picture,
          },
        });
      }
      const token = fastify.jwt.sign(
        {
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        {
          expiresIn: '7 days',
          sub: user.id,
        },
      );
      return { token };
    },
  );
  fastify.get(
    '/me',
    {
      onRequest: [authenticate],
      schema: {
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['user'],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  sub: { type: 'string' },
                  name: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      return { user: request.user };
    },
  );
};
