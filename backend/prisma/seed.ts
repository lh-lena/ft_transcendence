// Prisma seed script for the updated schema
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

const COLORMAPS = ['warm', 'cool', 'neutral'];
const GAME_STATUS = ['finished', 'cancled', 'cancled_server_error'];
const GAME_MODES = ['pvp_remote', 'pvp_ai', 'tournamnet'];

async function main() {
  // Seed Users
  const users = [];
  for (let i = 0; i < 25; i++) {
    let username = faker.internet
      .username()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6);
    if (!username || username.length === 0) {
      username = faker.string.alpha({ length: 6 });
    }
    users.push(
      await prisma.user.create({
        data: {
          email: faker.internet.email(),
          username,
          alias: username,
          guest: faker.datatype.boolean(),
          password_hash: faker.internet.password(),
          tfaEnabled: faker.datatype.boolean(),
          tfaSecret: faker.datatype.boolean() ? faker.string.alphanumeric(32) : null,
          tfaMethod: faker.helpers.arrayElement([null, 'email', 'totp', 'backup']),
          tfaTempCode: faker.datatype.boolean() ? faker.string.alphanumeric(6) : null,
          tfaCodeExpires: faker.datatype.boolean() ? faker.date.future() : null,
          backupCodes: faker.datatype.boolean() ? faker.string.alphanumeric(16) : null,
          color: faker.color.rgb(),
          colormap: faker.helpers.arrayElement(COLORMAPS),
        },
      }),
    );
  }

  // Seed Friendships
  // Use correct relation fields: userId, friendUserId
  const friendshipPairs = new Set();
  let friendshipEntries = 0;
  while (friendshipEntries < 100) {
    const userIdx = faker.number.int({ min: 0, max: users.length - 1 });
    const friendIdx = faker.number.int({ min: 0, max: users.length - 1 });
    if (userIdx === friendIdx) continue;
    const pairKey = `${users[userIdx].userId}-${users[friendIdx].userId}`;
    if (friendshipPairs.has(pairKey)) continue;

    await prisma.friendship.create({
      data: {
        userId: users[userIdx].userId,
        friendUserId: users[friendIdx].userId,
      },
    });
    friendshipPairs.add(pairKey);
    friendshipEntries++;
  }

  // Seed Blocked relationships
  // Use correct relation fields: userId, blockedUserId
  const blockedPairs = new Set();
  let blockedEntries = 0;
  while (blockedEntries < 40) {
    const userIdx = faker.number.int({ min: 0, max: users.length - 1 });
    const blockedIdx = faker.number.int({ min: 0, max: users.length - 1 });
    if (userIdx === blockedIdx) continue;
    const pairKey = `${users[userIdx].userId}-${users[blockedIdx].userId}`;
    if (blockedPairs.has(pairKey)) continue;

    await prisma.blocked.create({
      data: {
        userId: users[userIdx].userId,
        blockedUserId: users[blockedIdx].userId,
      },
    });
    blockedPairs.add(pairKey);
    blockedEntries++;
  }

  // Seed Results
  // Use correct IDs: resultId for relation, not id
  const results = [];
  for (let i = 0; i < 100; i++) {
    results.push(
      await prisma.result.create({
        data: {
          gameId: faker.string.uuid(),
          status: faker.helpers.arrayElement(GAME_STATUS),
          startedAt: faker.date.past(),
          finishedAt: faker.date.recent(),
        },
      }),
    );
  }

  // Seed GamePlayed
  // Use resultId for relation
  for (let i = 0; i < 100; i++) {
    await prisma.gamePlayed.create({
      data: {
        userId: faker.helpers.arrayElement(users).userId,
        resultId: faker.helpers.arrayElement(results).resultId,
        score: faker.number.int({ min: 0, max: 100 }),
        isWinner: faker.datatype.boolean(),
      },
    });
  }

  // Seed Chat Messages
  for (let i = 0; i < 100; i++) {
    let senderIdx = faker.number.int({ min: 0, max: users.length - 1 });
    let receiverIdx = faker.number.int({ min: 0, max: users.length - 1 });
    while (senderIdx === receiverIdx) {
      receiverIdx = faker.number.int({ min: 0, max: users.length - 1 });
    }
    await prisma.chatMessage.create({
      data: {
        senderId: users[senderIdx].userId,
        reciverId: users[receiverIdx].userId,
        message: faker.lorem.sentence(),
      },
    });
  }

  // Optionally: Seed BlackList table with random tokens
  for (let i = 0; i < 10; i++) {
    await prisma.blackList.create({
      data: {
        token: faker.string.alphanumeric(64),
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
