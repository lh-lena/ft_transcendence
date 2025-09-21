import { z } from 'zod/v4';
import { dtString } from './basics';

export const chatBase = z.object({
  senderId: z.uuid(),
  recieverId: z.uuid(),
  message: z.string(),
  createdAt: dtString,
});

const chatCreateBase = chatBase.pick({
  senderId: true,
  recieverId: true,
  message: true,
});
const chatCreate = chatCreateBase
  .meta({ $id: 'chatCreate' })
  .describe(
    'Create a new chat message. SenderId who sent, reciverId for who gets, message the content.',
  );

const chatQueryBase = chatBase
  .pick({
    senderId: true,
    recieverId: true,
  })
  .partial();
const chatQuery = chatQueryBase
  .meta({ $id: 'chatQuery' })
  .describe(
    'Query for chat messages. SenderId for all messages sent by user, add reciverId for all messages between two users, or empty for all messages.',
  );

const chatResponse = chatBase.meta({ $id: 'chatResponse' });
const chatResponseArray = z.array(chatBase).meta({ $id: 'chatResponseArray' });

export const chatSchemas = [chatCreate, chatQuery, chatResponse, chatResponseArray];

export type chatType = z.infer<typeof chatBase>;
export type chatCreateType = z.infer<typeof chatCreate>;
export type chatQueryType = z.infer<typeof chatQuery>;
