import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../auth/authMiddleware';
import { apiClientBackend } from '../apiClient';
import { TokenPayload } from '../types';

interface PrivacySettingsBody {
	marketingEmails?: boolean;
	dataSharingConsent?: boolean;
}

export default async function privacyRoutes(server: FastifyInstance) {
	// Delete account
	server.delete('/api/privacy/delete', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
		const req = request as FastifyRequest & { user: TokenPayload };
		await apiClientBackend.delete(`/user/${req.user.sub}`);
		return reply.send({ message: 'Account deleted' });
	});

	// Update privacy settings
	server.put('/api/privacy/settings', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
		const req = request as FastifyRequest & { user: TokenPayload };
		const { marketingEmails, dataSharingConsent } = req.body as PrivacySettingsBody;

		await apiClientBackend.put(`/user/${req.user.sub}`, { marketingEmails, dataSharingConsent });
		return reply.send({ message: 'Privacy settings updated' });
	});
}
