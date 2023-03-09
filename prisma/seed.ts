import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import DayJs from 'dayjs';
const futureDate = DayJs().add(7, 'day').toISOString();
const main = async () => {
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      avatarUrl: 'https://github.com/GabrieldosSantosOliveira.png',
    },
  });
  const pool = await prisma.pool.create({
    data: {
      title: 'Pool 1',
      code: '123456',
      ownerId: user.id,
      participants: {
        create: {
          userId: user.id,
        },
      },
    },
  });
  await prisma.game.create({
    data: {
      date: futureDate,
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'BR',
    },
  });
  await prisma.game.create({
    data: {
      date: futureDate,
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',
      guesses: {
        create: {
          firstTeamPoints: 4,
          secondTeamPoints: 2,
          participant: {
            connect: {
              userId_poolId: {
                userId: user.id,
                poolId: pool.id,
              },
            },
          },
        },
      },
    },
  });
};
main();
