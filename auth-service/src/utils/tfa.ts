import QRCode from 'qrcode';
import crypto from 'crypto';

import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from './passwords';
import { authenticator } from 'otplib';
import type { TfaSessionType, TfaVerifyType } from '../schemas/tfa';
import type { UserType } from '../schemas/user';

/**
 * Two-Factor Authentication Handler
 *
 * Manages 2FA setup, verification, and session handling for TOTP-based
 * two-factor authentication.
 *
 * Features:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - QR code generation for authenticator app setup
 * - Backup recovery codes
 * - Session management for multi-step authentication
 *
 */
export class tfaHandler {
  /**
   * In-memory storage for active 2FA sessions
   */
  private tfaSessions: Map<string, TfaSessionType> = new Map();

  private server: FastifyInstance;

  /**
   * Session expiration time (in minutes)
   * 2FA sessions expire after 7 minutes of inactivity
   */
  private readonly maxTime = 7;

  /**
   * Maximum 2FA code verification attempts per session
   * Prevents brute-force attacks on 6-digit codes
   */
  private readonly maxAttempts = 3;

  constructor(server: FastifyInstance) {
    this.server = server;

    this.server.decorate('cleanupExpiredSessions', () => {
      this.cleanupExpiredSessions();
    });

    this.startCleanupInterval();

    server.log.info('TFA handler initialized with in-memory session storage');
  }

  /**
   * Start automatic cleanup of expired sessions
   * Runs every 5 minutes to remove stale sessions
   *
   * @private
   */
  private startCleanupInterval(): void {
    setInterval(
      () => {
        const removedCount = this.cleanupExpiredSessions();
        if (removedCount > 0) {
          this.server.log.debug(`Cleaned up ${removedCount} expired 2FA sessions`);
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Create a new 2FA session
   *
   * Called after successful username/password authentication
   * when user has 2FA enabled. Returns session ID that client
   * must provide when submitting 2FA code.
   *
   * @param user - Authenticated user requiring 2FA
   * @returns 2FA session information for client
   *
   * @example
   * const tfaRequired = await fastify.tfa.handletfa(user);
   * return reply.status(200).send(tfaRequired);
   * // Client receives: { status: '2FA_REQUIRED', sessionId: '...', tfaMethod: 'totp' }
   */
  async handletfa(user: UserType): Promise<{
    status: string;
    tfaMethod: string;
    sessionId: string;
    userId: string;
    message: string;
  }> {
    const sessionId = uuidv4();

    const tfaSession: TfaSessionType = {
      sessionId,
      userId: user.userId,
      type: user.tfaMethod,
      create: new Date().toISOString(),
      attempts: 0,
    };

    this.tfaSessions.set(sessionId, tfaSession);

    this.server.log.info(
      {
        userId: user.userId,
        sessionId,
        tfaMethod: user.tfaMethod,
      },
      '2FA session created',
    );

    return {
      status: '2FA_REQUIRED',
      tfaMethod: user.tfaMethod!,
      sessionId,
      userId: user.userId,
      message: '2FA verification required',
    };
  }

  /**
   * Check if a 2FA session is valid
   *
   * Validates that:
   * - Session exists
   * - Session has not expired
   * - Session has not exceeded max attempts
   *
   * @param sessionId - Session ID from initial 2FA challenge
   * @returns true if session is valid, false otherwise
   *
   * @example
   * if (!await fastify.tfa.validSession(sessionId)) {
   *   return reply.status(401).send({ message: '2FA session expired' });
   * }
   */
  async validSession(sessionId: string): Promise<boolean> {
    const session = this.tfaSessions.get(sessionId);

    if (!session) {
      this.server.log.warn({ sessionId }, '2FA session not found');
      return false;
    }

    const now = new Date();
    const sessionTime = new Date(session.create);
    const diffMinutes = (now.getTime() - sessionTime.getTime()) / 60000;

    if (diffMinutes > this.maxTime) {
      this.server.log.warn(
        {
          sessionId,
          age: diffMinutes.toFixed(2) + ' minutes',
        },
        '2FA session expired',
      );

      this.tfaSessions.delete(sessionId);
      return false;
    }

    if (session.attempts >= this.maxAttempts) {
      this.server.log.warn(
        {
          sessionId,
          attempts: session.attempts,
        },
        '2FA max attempts exceeded',
      );

      this.tfaSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired 2FA sessions
   *
   * Removes sessions older than maxTime.
   * Called automatically every 5 minutes by cleanup interval.
   *
   * @returns Number of sessions removed
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let removedCount = 0;

    for (const [sessionId, session] of this.tfaSessions.entries()) {
      const sessionTime = new Date(session.create);
      const diffMinutes = (now.getTime() - sessionTime.getTime()) / 60000;

      if (diffMinutes > this.maxTime) {
        this.tfaSessions.delete(sessionId);
        removedCount++;
      }
    }
    return removedCount;
  }

  /**
   * Verify TOTP code
   *
   * Validates a 6-digit TOTP code from user's authenticator app.
   *
   * @param tfaData - Verification request containing code and session ID
   * @param user - User attempting to verify
   * @returns 'valid' if code is correct, error message otherwise
   *
   * @example
   * const result = await fastify.tfa.checkTotp({ code: '123456', sessionId }, user);
   * if (result === 'valid') {
   *   // Complete login
   * } else {
   *   // Show error message
   * }
   */
  async checkTotp(tfaData: TfaVerifyType, user: UserType): Promise<string> {
    if (!user.tfaSecret) {
      this.server.log.error(
        { userId: user.userId },
        'TOTP verification attempted but no secret found',
      );
      return 'No TOTP secret found. Please set up TOTP 2FA.';
    }

    const session = this.tfaSessions.get(tfaData.sessionId);
    if (session) {
      session.attempts++;
    }

    const isValid = authenticator.check(tfaData.code, user.tfaSecret);

    if (isValid) {
      this.server.log.info(
        {
          userId: user.userId,
          sessionId: tfaData.sessionId,
        },
        'TOTP verification successful',
      );

      this.tfaSessions.delete(tfaData.sessionId);

      return 'valid';
    }

    return 'Invalid TOTP code. Please try again.';
  }

  /**
   * Verify backup recovery code
   *
   * Validates a backup code and removes it from user's available codes.
   * Each backup code can only be used once.
   *
   * @param tfaData - Verification request containing code and session ID
   * @param user - User attempting to verify
   * @returns 'valid' if code is correct and removed, error message otherwise
   *
   * @example
   * const result = await fastify.tfa.checkBackup({ code: 'abc123...', sessionId }, user);
   * if (result === 'valid') {
   *   // Complete login and warn user they have fewer backup codes
   * }
   */
  async checkBackup(tfaData: TfaVerifyType, user: UserType): Promise<string> {
    if (!user.backupCodes || user.backupCodes.trim() === '') {
      this.server.log.error(
        {
          userId: user.userId,
        },
        'Backup code verification attempted but no codes found',
      );
      return 'No backupcodes stored. Say bye bye to your account';
    }

    const backupList = user.backupCodes.split(',');

    const session = this.tfaSessions.get(tfaData.sessionId);
    if (session) {
      session.attempts++;
    }

    const submittedCodeHash = sha256(tfaData.code.trim());
    const idx = backupList.findIndex((hash) => hash === submittedCodeHash);

    if (idx === -1) {
      this.server.log.warn(
        {
          userId: user.userId,
          sessionId: tfaData.sessionId,
          remainingCodes: backupList.length,
        },
        'Backup code verification failed',
      );

      return 'Invalid backup code. Please try again.';
    }

    const updatedList = [...backupList];
    updatedList.splice(idx, 1);
    const updatedString = updatedList.join(',');

    this.server.log.info(
      {
        userId: user.userId,
        sessionId: tfaData.sessionId,
        remainingCodes: updatedList.length,
      },
      'Backup code verified and removed',
    );

    await this.server.user.patch(user.userId, { backupCodes: updatedString });

    this.tfaSessions.delete(tfaData.sessionId);

    if (updatedList.length <= 2) {
      return 'valid_low_codes'; // Client should show warning
    }

    return 'valid';
  }

  /**
   * Set up TOTP 2FA for a user
   *
   * Generates:
   * - Secret key for TOTP algorithm
   * - QR code for scanning into authenticator app
   * - 8 backup recovery codes
   *
   * @param user - User enabling 2FA
   * @returns Object with QR code, otpauth URI, and backup codes
   *
   * @example
   * const setup = await fastify.tfa.setupTotp(user);
   * return reply.send({
   *   qrCode: setup.qrCodeDataUrl, // Show in UI for scanning
   *   codes: setup.codes, // Display for user to save
   *   message: 'Save these backup codes in a secure location'
   * });
   */
  async setupTotp(
    user: UserType,
  ): Promise<{ otpauth: string; qrCodeDataUrl: string; codes: string[] }> {
    const secret = authenticator.generateSecret();

    const otpauth = authenticator.keyuri(user.username, 'ft_transcendence', secret);

    const codes = Array.from({ length: 8 }, () => crypto.randomBytes(8).toString('hex'));

    const codesToHash = codes.map(sha256);
    const codesString = codesToHash.join(',');

    await this.server.user.patch(user.userId, {
      tfaEnabled: true,
      tfaMethod: 'totp',
      tfaSecret: secret,
      backupCodes: codesString,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    this.server.log.info(
      {
        userId: user.userId,
        username: user.username,
      },
      '2FA setup completed',
    );

    return {
      otpauth,
      qrCodeDataUrl,
      codes,
    };
  }

  /**
   * Disable 2FA for a user
   *
   * Removes TOTP secret and backup codes.
   * Should require password confirmation before allowing.
   *
   * @param userId - User ID to disable 2FA for
   * @returns Promise<void>
   */
  async disableTfa(userId: string): Promise<void> {
    await this.server.user.patch(userId, {
      tfaEnabled: false,
      tfaMethod: null,
      tfaSecret: null,
      backupCodes: null,
    });

    this.server.log.info({ userId }, '2FA disabled');
  }
}
