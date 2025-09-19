// src/routes/2fa.ts
import { FastifyInstance, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';
import { sendMail } from '../services/mailer';
import { generate6DigitCode, nowPlusMinutes, sha256 } from '../services/twofa';
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

  async handletfa(user: UserType, reply: FastifyReply): Promise<FastifyReply> {
    const tfaSession: TfaSessionType = {
      sessionId: uuidv4() as string,
      userId: user.userId,
      type: user.tfaMethod,
      create: new Date().toISOString(),
    };
    this.tfaSessions.push(tfaSession);

    const tfaRequiredMessage = {
      status: '2FA_REQUIRED',
      tfwMethod: user.tfaMethod,
      sessionId: tfaSession.sessionId,
      userId: user.userId,
      message: '2FA verification required',
    };

    if (user.tfaMethod === 'email') {
      const code = generate6DigitCode();
      const expires = nowPlusMinutes(5);

      const config: AxiosRequestConfig = {
        method: 'patch',
        url: `/user/${user.userId}`,
        params: user.userId,
        data: { tfaTempCode: code, tfaCodeExpires: expires },
      };

      await apiClientBackend(config);

      await sendMail(
        user.email,
        'Your 2FA Code',
        `Your 2FA code is: ${code}. It expires in 5 minutes.`,
      );

      return reply.code(200).send((tfaRequiredMessage.message = '2FA code sent to email'));
    }

    return reply.code(200).send(tfaRequiredMessage);
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

  //TODO cleanup
  async sendJwt(user: UserType, reply: FastifyReply): Promise<FastifyReply> {
    const accessToken = this.server.generateAccessToken({ id: user.userId });
    const refreshToken = this.server.generateRefreshToken({ id: user.userId });

    console.log('Generated efresh Token:', refreshToken);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return reply.code(200).send({ jwt: accessToken, userId: user.userId });
  }

  async checkMail(
    tfaData: TfaVerifyType,
    user: UserType,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    if (!user.tfaTempCode || !user.tfaCodeExpires) {
      return reply.code(401).send({ message: 'No 2FA code found. Please request a new code.' });
    }

    if (new Date() > new Date(user.tfaCodeExpires)) {
      return reply.code(401).send({ message: '2FA code has expired. Please request a new code.' });
    }

    if (user.tfaTempCode !== tfaData.code) {
      return reply.code(401).send({ message: 'Invalid 2FA code. Please try again.' });
    }

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      params: user.userId,
      data: { tfaTempCode: null, tfaCodeExpires: null },
    };

    await apiClientBackend(config);

    return await this.sendJwt(user, reply);
  }

  async checkTotp(
    tfaData: TfaVerifyType,
    user: UserType,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    if (!user.tfaSecret) {
      return reply.code(400).send({ message: 'No TOTP secret found. Please set up TOTP 2FA.' });
    }
    const isValid = authenticator.check(tfaData.code, user.tfaSecret);
    if (!isValid) {
      return reply.code(400).send({ message: 'Invalid TOTP code. Please try again.' });
    }
    return await this.sendJwt(user, reply);
  }

  async checkBackup(
    tfaData: TfaVerifyType,
    user: UserType,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const backupList = user.backupCodes || [];
    const idx = backupList.findIndex((h) => h === sha256(tfaData.code.trim()));
    if (idx === -1) {
      return reply.code(401).send({ message: 'Invalid backup code. Please try again.' });
    }

    const updatedList = backupList.slice();
    updatedList.splice(idx, 1);

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      params: user.userId,
      data: { backupCodes: updatedList },
    };

    await apiClientBackend(config);

    return await this.sendJwt(user, reply);
  }

  async setupTotp(user: UserType, reply: FastifyReply): Promise<FastifyReply> {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'ft_transcendence', secret);
    const codes = Array.from({ length: 8 }, () => crypto.randomBytes(8).toString('hex'));

    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      params: user.userId,
      data: {
        tfaEnabled: true,
        tfaMethod: 'totp',
        tfaSecret: secret,
        backupCodes: codes.map(sha256),
      },
    };

    await apiClientBackend(config);

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return reply.code(200).send({
      otpauth,
      qrCodeDataUrl,
      codes,
      message:
        'TOTP 2FA setup complete. Dont lose the Backup Codes and Store the QRCode! Otherwise you wont have access to your acount!',
    });
  }

  async setupEmail(user: UserType, reply: FastifyReply): Promise<FastifyReply> {
    const config: AxiosRequestConfig = {
      method: 'patch',
      url: `/user/${user.userId}`,
      params: user.userId,
      data: {
        tfaEnabled: true,
        tfaMethod: 'email',
      },
    };

    await apiClientBackend(config);

    return reply.code(200).send({ message: 'Email 2FA setup complete.' });
  }
}

// TOTP Verify & Enable
//const totpVerifySchema = z.object({ token: z.string() });
//server.post('/api/auth/2fa/totp/verify', { preHandler: authMiddleware }, async (req, reply) => {
//  const parseResult = totpVerifySchema.safeParse(req.body);
//  if (!parseResult.success) return reply.status(400).send({ error: parseResult.error.issues });
//
//  const user = await loadUserById((req as any).user.sub);
//  if (!user.twofa_secret) return reply.status(400).send({ error: 'No TOTP secret found' });
//
//  if (!authenticator.check(parseResult.data.token, user.twofa_secret)) return reply.status(400).send({ error: 'Invalid TOTP code' });
//
//  await apiClientBackend.put(`/user/${user.id}`, { is_2fa_enabled: true, twofa_method: 'totp' });
//  return reply.send({ message: 'TOTP 2FA enabled' });
//});
