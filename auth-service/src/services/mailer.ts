import nodemailer from 'nodemailer';
import { config } from '../config';

export const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: { user: config.smtpUser, pass: config.smtpPass },
});

export async function sendMail(to: string, subject: string, text: string) {
  return transporter.sendMail({ from: '"ft_transcendance" <no-reply@transcendance.com>', to, subject, text });
}
