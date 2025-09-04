export type TwoFAMethod = 'email' | 'totp' | null;

export type UserRecord = {
  id: number;
  email: string;
  username: string;
  alias?: string | null;
  password_hash: string;
  is_2fa_enabled: boolean;
  twofa_method: TwoFAMethod;
  twofa_temp_code?: string | null;
  twofa_code_expires?: string | null;
  twofa_secret?: string | null;
  backup_codes?: string[] | null;
  marketingEmails?: boolean;
  dataSharingConsent?: boolean;
};

export interface TokenPayload {
  sub: number;
  username: string;
  email: string;
  alias?: string;
  is_2fa_enabled: boolean;
  iat?: number;
  exp?: number;
}

export type AuthenticatedRequest = import('fastify').FastifyRequest & { user: TokenPayload };
