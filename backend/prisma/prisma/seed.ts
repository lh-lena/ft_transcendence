const { PrismaClient, GameStatus, GameMode } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return;
  }

  // Seed users
  const users = [];
  for (let i = 0; i < 100; i++) {
    users.push(
      await prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.username() + faker.number.int().toString(),
          password_hash: faker.internet.password(),
          is_2fa_enabled: faker.datatype.boolean(),
          twofa_secret: faker.datatype.boolean() ? faker.string.alphanumeric(32) : null,
        },
      }),
    );
  }

  // Seed friends relationships (no duplicates, no self-friend)
  const friendPairs = new Set();
  let friendEntries = 0;
  while (friendEntries < 100) {
    const userIdx = faker.number.int({ min: 0, max: users.length - 1 });
    const friendIdx = faker.number.int({ min: 0, max: users.length - 1 });
    if (userIdx === friendIdx) continue;

    const pairKey = `${users[userIdx].id}-${users[friendIdx].id}`;
    const reverseKey = `${users[friendIdx].id}-${users[userIdx].id}`;
    if (friendPairs.has(pairKey) || friendPairs.has(reverseKey)) continue;

    await prisma.friend.create({
      data: {
        userId: users[userIdx].id,
        friendId: users[friendIdx].id,
      },
    });
    friendPairs.add(pairKey);
    friendEntries++;
  }

  // Seed results
  const results = [];
  for (let i = 0; i < 100; i++) {
    results.push(
      await prisma.result.create({
        data: {
          gameId: faker.string.uuid(),
          status: faker.helpers.arrayElement([
            GameStatus.finished,
            GameStatus.cancled,
            GameStatus.cancled_server_error,
          ]),
          startedAt: faker.date.past(),
          finishedAt: faker.date.recent(),
        },
      }),
    );
  }

  // Seed gamePlayed
  for (let i = 0; i < 100; i++) {
    await prisma.gamePlayed.create({
      data: {
        userId: faker.helpers.arrayElement(users).id,
        resultId: faker.helpers.arrayElement(results).id,
        score: faker.number.int({ min: 0, max: 100 }),
        isWinner: faker.datatype.boolean(),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
