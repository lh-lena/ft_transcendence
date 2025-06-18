
export default async function testRoute( fastify, options ){
	fastify.get('/test-db', async (request, reply) => {
		const items = fastify.db.prepare( 'SELECT * FROM test_items').all();
		return items;
	});
}
