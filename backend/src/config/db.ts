import fp from 'fastify-plugin';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

async function dbConnector(fastify, options){

	//start database
	const dbFile = fastify.dbFile;
	const db = new Database(dbFile, { verbose: console.log });

	//enable foreign keys
	db.pragma( 'foreign_keys = ON' );

	//apply schema files
	const migrationDir = path.join(__dirname, '..', 'migrations');
	const migrationFiles = fs
		.readdirSync(migrationDir).filter(file => file.endsWith('.sql')).sort();

	for (const file of migrationFiles ){
		const filePath = path.join(migrationDir, file);
		const schema = fs.readFileSync(filePath, 'utf8' );
		db.exec(schema);
	}

	
	fastify.decorate('db', db);
	
	//close database on closing fastyify instance
	fastify.addHook('onClose', (fastify, done) => {
		db.close();
		done();
	});
	 
}

export default fp(dbConnector);
