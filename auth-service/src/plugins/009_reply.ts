import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

//general reply plugin for sending responses

interface SendOptions {
  code?: number;
  data?: object;
  message?: string;
  includeAuth?: boolean;
  userId?: string;
}

interface ResponseData {
  message?: string;
  timestamp: string;
  jwt?: string;
  userId?: string;
  [key: string]: unknown;
}

const replyPlugin = async (fastify: FastifyInstance) => {
  //sending function
  function doSending(this: FastifyReply, options: SendOptions = {}): FastifyReply {
    const { code = 200, data = {}, message, includeAuth = false, userId } = options;

    //set code
    this.code(code);

    //popoulate reply with timestamp and given data
    const response: ResponseData = { ...data, timestamp: new Date().toISOString() };

    //set message
    if (message) {
      response.message = message;
    }

    //if includeAuth is needed set jwt and userId
    if (includeAuth && userId) {
      this.setAuthCookies(userId);
      if (this.authData) {
        const authData = this.authData;
        response.jwt = authData.jwt;
        response.userId = authData.userId;
      }
    }

    //send reply
    return this.send(response);
  }

  fastify.decorateReply('doSending', doSending);
};

export default fp(replyPlugin);
