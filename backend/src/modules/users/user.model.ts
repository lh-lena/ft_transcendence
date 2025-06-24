import { db } from '../../config/db';

export function findAll( db ) {
	const stmt = db.prepare( 'SELECT * FROM users' );
	return stmt.all();
}

export function findById( db, id: number ) {
	const stmt = db.prepare( 'SELECT * FROM users WHERE id = ?' );
	return stmt.get( id );
}

export function insert( db, data: CreateUserInput ) {
	const stmt = db.prepare( 'INSERT INTO users (email, two_fa_enabled, first_name, display_name, avatar_url) VALUES ( ?, ?, ?, ?, ? ) ' );

	const newUser = stmt.run( 
		data.email,
		data.two_fa_enabled ?? false,
		data.two_fa_enabled,
		data.first_name ?? null,
		data.display_name ?? null,
		data.avatar_url ?? null
	);

	const getStmt = db.prepare( 'SELECT * FROM users WHERE id = ?' );
	return getStmt.get( result.lastInsertRowid );
}
