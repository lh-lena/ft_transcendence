import Database from 'better-sqlite3';
import { ServerContext } from '../../context';

class	NotFoundError extends Error {}
class	DatabaseError extends Error {}

export function findAll(
	context: ServerContext,
) {
	const stmt = context.db.prepare( 'SELECT * FROM users' );
	return stmt.all();
}

export function findById(
	context: ServerContext,
	id: Number
) {
	const stmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
	const user = stmt.get( id );
	if( !user )
		throw new NotFoundError( `User with ${id} not found` );
	return user;
}

export function insert(
	context: ServerContext,
	data: CreateUserInput
) {
	const tmp_hash = 'lalalalalalalalalalalalalalalalalala';

	const stmt = context.db.prepare( 
		' INSERT INTO users ( \
		email, \
		password_hash, \
		two_fa_enabled, \
		first_name, \
		display_name, \
		avatar_url \
		) \
		VALUES ( ?, ?, ?, ?, ?, ? ) '
		);

	const newUser = stmt.run( 
		data.email,
		tmp_hash,
		data.two_fa_enabled ?? 'false',
		data.first_name ?? null,
		data.display_name ?? null,
		data.avatar_url ?? null
	);

	const getStmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
	const user = getStmt.get( newUser.lastInsertRowid );
	return user;
}

export function patch( 
	context: ServerContext,
	id: Number,
	data: PatchUserInput
){
	const fields = Object.keys( data );
	const setKeys = fields.map( field => `${field} = ?`).join(', ');
	const values = fields.map( field => (data as any)[field]);

	const sql = `UPDATE users SET ${setKeys} WHERE id = ?`

	const stmt = context.db.prepare( sql );
	stmt.run( ...values, id );

	if( result.changes === 0 )
		throw new NotFoundError( `User with id ${id} not found` );
	
	const getStmt = context.db.prepare( 'SELECT FROM users WHERE id = ?' );
	const user = getStmt.get( id );
	return user;
}

export function del(
	context: ServerContext,
	id: Number
) {
	const stmt = context.db.prepare( 'DELETE FROM users WHERE  id = ?' );
	const deletedUser = stmt.run( id );

	if( deletedUser.changes === 0 )
		throw new NotFoundError( `User with ${id} not found` );

	return true;
}
