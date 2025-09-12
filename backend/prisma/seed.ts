const { PrismaClient, GameStatus, GameMode } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  // Exit if users already exist
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return;
  }

  // Seed Users
  const users = [];
  for (let i = 0; i < 100; i++) {
    // Generate a username of max 5 chars
    let username = faker.internet
      .username()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 5);
    // Ensure not empty, fallback if needed
    if (!username || username.length === 0) {
      username = faker.string.alpha({ length: 5 });
    }
    users.push(
      await prisma.user.create({
        data: {
          email: faker.internet.email(),
          username,
          alias: username,
          password_hash: faker.internet.password(),
          is_2fa_enabled: faker.datatype.boolean(),
          twofa_secret: faker.datatype.boolean() ? faker.string.alphanumeric(32) : null,
          guest: faker.datatype.boolean(),
          color: faker.color.rgb(),
          colormap: faker.helpers.arrayElement(['warm', 'cool', 'neutral']),
          // avatar: not initialized
        },
      }),
    );
  }

  // Seed Friendships (no duplicates, no self-friend)
  const friendshipPairs = new Set();
  let friendshipEntries = 0;
  while (friendshipEntries < 100) {
    const userIdx = faker.number.int({ min: 0, max: users.length - 1 });
    const friendIdx = faker.number.int({ min: 0, max: users.length - 1 });
    if (userIdx === friendIdx) continue;
    const pairKey = `${users[userIdx].id}-${users[friendIdx].id}`;
    if (friendshipPairs.has(pairKey)) continue;

    await prisma.friendship.create({
      data: {
        userId: users[userIdx].id,
        friendId: users[friendIdx].id,
      },
    });
    friendshipPairs.add(pairKey);
    friendshipEntries++;
  }

  // Seed Blocked relationships (no duplicates, no self-block)
  const blockedPairs = new Set();
  let blockedEntries = 0;
  while (blockedEntries < 40) {
    const userIdx = faker.number.int({ min: 0, max: users.length - 1 });
    const blockedIdx = faker.number.int({ min: 0, max: users.length - 1 });
    if (userIdx === blockedIdx) continue;
    const pairKey = `${users[userIdx].id}-${users[blockedIdx].id}`;
    if (blockedPairs.has(pairKey)) continue;

    await prisma.blocked.create({
      data: {
        userId: users[userIdx].id,
        blockedId: users[blockedIdx].id,
      },
    });
    blockedPairs.add(pairKey);
    blockedEntries++;
  }

  // Seed Results
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

  // Seed GamePlayed
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

  // Seed Chat Messages (random sender/receiver, no self-message)
  for (let i = 0; i < 100; i++) {
    let senderIdx = faker.number.int({ min: 0, max: users.length - 1 });
    let receiverIdx = faker.number.int({ min: 0, max: users.length - 1 });
    while (senderIdx === receiverIdx) {
      receiverIdx = faker.number.int({ min: 0, max: users.length - 1 });
    }
    await prisma.chatMessage.create({
      data: {
        senderId: users[senderIdx].id,
        reciverId: users[receiverIdx].id,
        message: faker.lorem.sentence(),
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
