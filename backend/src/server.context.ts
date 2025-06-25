import { FastifyInstance } from 'fastify';
import { Database } from 'better-sqlite3';
import { Config } from './config/config';

export type ServerContext = {
	server: FastifyInstance;
	db: Database;
	config: Config;
};

export function createContext( server: FastifyInstance, db: Database, config: Config ) : ServerContext {
	return {
		server,
		db,
		config,
	};
}
