import Database from 'better-sqlite3';
import { ServerContext } from '../../context';

class	NotFoundError extends Error {}
class	DatabaseError extends Error {}

export function findAll(
	context: ServerContext,
) {
	try{
		const stmt = context.db.prepare( 'SELECT * FROM users' );
		return stmt.all();
	} catch( err ){
		throw new DatabaseError( 'Failed to fetch users' );
	}
}

export function findById(
	context: ServerContext,
	id: Number
) {
	try{
		const stmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
		const user = stmt.get( id );
		if( !user )
			throw new NotFoundError( `User with ${id} not found` );
		return user;
	} catch( err ){
		if( err instanceof NotFoundError )
			throw err;
		throw new DatabaseError( 'Failed to fetch user' );
	}
}

export function insert(
	context: ServerContext,
	data: CreateUserInput
) {
	try{

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
		if( !user )
			throw new NotFoundError( 'Could not create new User' );
		return user;
	} catch( err: any ){
		if( err.code === 'SQLITE_CONSTRAINT_UNIQE' )
			throw new DatabaseError( 'User with this uniqe atribure already exists' );
		throw new DatabaseError( 'Could not insert User' );
	}
}

export function patch( 
	context: ServerContext,
	id: Number,
	data: PatchUserInput
){
	try{
		const fields = Object.keys( data );
		
		const setKeys = fields.map( field => `${field} = ?`).join(', ');
		const values = fields.map( field => (data as any)[field]);

		const sql = `UPDATE users SET ${setKeys} WHERE id = ?`

		const stmt = context.db.prepare( sql );
		stmt.run( ...values, id );

		if( result.changes === 0 )
			throw new NotFoundError( `User with id ${id} not found` );
		
		const getStmt = context.db.prepare( 'SELECT FROM users WHERE id = ?' );
		return getStmt.get( id );
	} catch( err ){
		if( err instanceof NotFoundError ) 
			throw err;
		throw new DatabaseError( 'Failed to update' );
	}
}

export function del(
	context: ServerContext,
	id: Number
) {
	try{
		const stmt = context.db.prepare( 'DELETE FROM users WHERE  id = ?' );
		const deletedUser = stmt.run( id );

		if( deletedUser.changes === 0 )
			throw new NotFoundError( `User with ${id} not found` );

		return true;
	} catch( err ){
		if( err instanceof NotFoundError )
			throw err;
		throw new DatabaseError( 'Failed to delete User' );
	}
}
