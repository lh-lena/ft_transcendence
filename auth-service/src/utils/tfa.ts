// src/routes/2fa.ts
import { FastifyInstance, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';
import { sha256 } from './twofa';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import type { TfaSessionType, TfaVerifyType } from '../schemas/tfa';
import type { UserType } from '../schemas/user';

export class tfaHandler {
  private tfaSessions: TfaSessionType[] = [];
  private server: FastifyInstance;

  constructor(server: FastifyInstance) {
    this.server = server;
    this.server.decorate('cleanupExpiredSessions', () => {
      this.cleanupExpiredSessions();
    });
  }

  async handletfa(user: UserType) {
    const tfaSession: TfaSessionType = {
      sessionId: uuidv4() as string,
      userId: user.userId,
      type: user.tfaMethod,
      create: new Date().toISOString(),
    };

    this.tfaSessions.push(tfaSession);

    const tfaRequiredMessage = {
      status: '2FA_REQUIRED',
      tfaMethod: user.tfaMethod,
      sessionId: tfaSession.sessionId,
      userId: user.userId,
      message: '2FA verification required',
    };

    return tfaRequiredMessage;
  }

  async validSession(sessionId: string): Promise<boolean> {
    const session = this.tfaSessions.find((session) => session.sessionId === sessionId);
    if (session) return true;
    return false;
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    this.tfaSessions = this.tfaSessions.filter((session) => {
      const sessionTime = new Date(session.create);
      const diffMinutes = (now.getTime() - sessionTime.getTime()) / 60000;
      if (diffMinutes > 7) {
        this.tfaSessions = this.tfaSessions.filter((s) => s.sessionId !== session.sessionId);
      }
    });
  }

  async checkTotp(tfaData: TfaVerifyType, user: UserType): Promise<string> {
    //TODO Log and throw error + proper handling
    //
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    if (!user.tfaSecret) {
      return reply.code(400).send({
        message: 'No TOTP secret found. Please set up TOTP 2FA.',
      });
    }
    const isValid = authenticator.check(tfaData.code, user.tfaSecret);

    if (!isValid) {
      return reply.code(400).send({ message: 'Invalid TOTP code. Please try again.' });
    }
    return 'valid';
  }

  async checkBackup(tfaData: TfaVerifyType, user: UserType): Promise<FastifyReply> {
    //TODO Log and throw error + proper handling
    //
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }
    if (!user.backupCodes) {
      return reply
        .code(400)
        .send({ message: 'No backupcodes stored. Say bye bye to your accoutn' });
    }
    const backupList = user.backupCodes.split(',');
    const idx = backupList.findIndex((h) => h === sha256(tfaData.code.trim()));
    if (idx === -1) {
      return reply.code(401).send({ message: 'Invalid backup code. Please try again.' });
    }

    const updatedList = backupList.slice();
    updatedList.splice(idx, 1);
    const updatedString = updatedList.join(',');

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      data: { backupCodes: updatedString },
    };

    await apiClientBackend(config);
  }

  async setupTotp(
    user: UserType,
  ): Promise<{ otpauth: string; qrCodeDataUrl: string; codes: string }> {
    //TODO throw error + proper handling

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    if (user.tfaEnabled && user.tfaMethod === 'totp') {
      return reply.code(400).send({ message: 'TOTP 2FA is already enabled.' });
    }
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.username, 'ft_transcendence', secret);
    const codes = Array.from({ length: 8 }, () => crypto.randomBytes(8).toString('hex'));
    const codesToHash = codes.map(sha256);
    const codesString = codesToHash.join(',');

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      data: {
        tfaEnabled: true,
        tfaMethod: 'totp',
        tfaSecret: secret,
        backupCodes: codesString,
      },
    };

    await apiClientBackend(config);

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return {
      otpauth,
      qrCodeDataUrl,
      codes,
    };
  }
}
