import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export function generate6DigitCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function nowPlusMinutes(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export async function generateTotpQRCode(secret: string, label: string): Promise<string> {
  const otpauth = authenticator.keyuri(label, 'ft_transcendance', secret);
  return QRCode.toDataURL(otpauth);
}

export function verifyTotp(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
