// src/routes/2fa.ts
import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/authMiddleware';
import { loadUserByEmail, loadUserById, apiClientBackend } from '../services/userService';
import { sendMail } from '../services/mailer';
import { generate6DigitCode, nowPlusMinutes, sha256 } from '../services/twofa';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import crypto from 'crypto';



export default async function twofaRoutes(server: FastifyInstance) {

	// Email / TOTP / Backup 2FA verification
	const verifySchema = z.object({
		email: z.string().email(),
		code: z.string(),
		type: z.enum(['email', 'totp', 'backup']).optional(),
	});

	server.post('/api/auth/2fa/verify', async (req, reply) => {
		const parseResult = verifySchema.safeParse(req.body);
		if (!parseResult.success) return reply.status(400).send({ error: parseResult.error.issues });

		const { email, code, type } = parseResult.data;
		const user = await loadUserByEmail(email);
		if (!user) return reply.status(404).send({ error: 'User not found' });

		// Email 2FA
		if (!type || type === 'email') {
			if (!user.twofa_temp_code || !user.twofa_code_expires) return reply.status(400).send({ error: '2FA (email) not initiated' });
			if (new Date() > new Date(user.twofa_code_expires)) return reply.status(401).send({ error: 'Code expired' });
			if (user.twofa_temp_code !== code) return reply.status(401).send({ error: 'Invalid code' });

			await apiClientBackend.put(`/user/${user.id}`, { twofa_temp_code: null, twofa_code_expires: null });
		}

		// TOTP
		if (type === 'totp') {
			if (!user.twofa_secret) return reply.status(400).send({ error: 'TOTP not set up' });
			if (!authenticator.check(code, user.twofa_secret)) return reply.status(401).send({ error: 'Invalid TOTP code' });
		}

		// Backup
		if (type === 'backup') {
			const backupList = user.backup_codes ?? [];
			const idx = backupList.findIndex(h => h === sha256(code.trim()));
			if (idx === -1) return reply.status(401).send({ error: 'Invalid backup code' });

			const updated = backupList.slice();
			updated.splice(idx, 1);
			await apiClientBackend.put(`/user/${user.id}`, { backup_codes: updated });
		}

		return reply.send({ message: '2FA verified successfully' });
	});

	// TOTP Setup
	server.post('/api/auth/2fa/totp/setup', { preHandler: authMiddleware }, async (req, reply) => {
		const user = await loadUserById((req as any).user.sub);
		const secret = authenticator.generateSecret();
		const otpauth = authenticator.keyuri(user.email, 'ft_transcendance', secret);

		await apiClientBackend.put(`/user/${user.id}`, { twofa_secret: secret });
		const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

		return reply.send({ otpauth, qrCodeDataUrl });
	});

	// TOTP Verify & Enable
	const totpVerifySchema = z.object({ token: z.string() });
	server.post('/api/auth/2fa/totp/verify', { preHandler: authMiddleware }, async (req, reply) => {
		const parseResult = totpVerifySchema.safeParse(req.body);
		if (!parseResult.success) return reply.status(400).send({ error: parseResult.error.issues });

		const user = await loadUserById((req as any).user.sub);
		if (!user.twofa_secret) return reply.status(400).send({ error: 'No TOTP secret found' });

		if (!authenticator.check(parseResult.data.token, user.twofa_secret)) return reply.status(400).send({ error: 'Invalid TOTP code' });

		await apiClientBackend.put(`/user/${user.id}`, { is_2fa_enabled: true, twofa_method: 'totp' });
		return reply.send({ message: 'TOTP 2FA enabled' });
	});

	// Backup codes generation
	server.post('/api/auth/2fa/backup/regenerate', { preHandler: authMiddleware }, async (req, reply) => {
		const user = await loadUserById((req as any).user.sub);
		const codes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex'));
		await apiClientBackend.put(`/user/${user.id}`, { backup_codes: codes.map(sha256) });
		return reply.send({ backupCodes: codes });
	});

}
