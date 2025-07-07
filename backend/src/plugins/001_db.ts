import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPlugin = async ( server: FastifyInstance ) => {

	//start database
	const dbFile = server.config.DB_PATH;
  
	const db = new Database( dbFile, { verbose: console.log } );

	//enable foreign keys
	db.pragma( 'foreign_keys = ON' );

	//apply schema files
	const migrationDir = path.join(__dirname, '../database/migrations' );

	const migrationFiles = fs
		.readdirSync(migrationDir).filter(file => file.endsWith('.sql')).sort();

	for (const file of migrationFiles ){
		const filePath = path.join(migrationDir, file);
		const schema = fs.readFileSync(filePath, 'utf8' );
		db.exec(schema);
	}

	
	server.decorate('db', db);
	
	//close database on closing fastyify instance
	server.addHook('onClose', (server, done) => {
		db.close();
		done();
	});
	 
}

export default fp( dbPlugin );
