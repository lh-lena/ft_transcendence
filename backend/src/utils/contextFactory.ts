import { FastifyInstance } from 'fastify';
import { Database } from 'better-sqlite3';
import { Config } from './config/config';

export interface ServerContext {
	db: Database;
	config: Config;
  logger: FastifyBaseLogger;
};

export function contextFactory( db: Database, config: Config ) : ServerContext {
	return {
		db,
		config,
	};
}
