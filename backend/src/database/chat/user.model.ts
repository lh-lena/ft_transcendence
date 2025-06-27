import Database from 'better-sqlite3';
import { ServerContext } from '../../context';
import { createCrud } from '../../utils/crudGenerator';
import { ConflictError } from '../../utils/error';

export const userModel = createCrud( 'users', );

export function findAll(
	context: ServerContext,
) {
	return userModel.findAll( context );
//	const stmt = context.db.prepare( 'SELECT * FROM users' );
//	return stmt.all();
}

export function findById(
	context: ServerContext,
	id: number
) {
	return userModel.findById( context, id );
//	const stmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
//	const user = stmt.get( id );
//
//	return user;
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

	       let newUser;

	try{
		newUser = stmt.run( 
			data.email,
			tmp_hash,
			data.two_fa_enabled ?? 'false',
			data.first_name ?? null,
			data.display_name ?? null,
			data.avatar_url ?? null
		       );
	
		const getStmt = context.db.prepare( 'SELECT * FROM users WHERE id = ?' );
		const user = getStmt.get( newUser.lastInsertRowid );

	} catch( err: any ){
		console.error( '\nlogged conflict error\n' );
		throw new ConflictError( 'Resource alredy in use' );
	}

       return user;
}

export function patch( 
      context: ServerContext,
      id: number,
      data: PatchUserInput
) {

	const fields = Object.keys( data );

	if( filds.length === 0 )
		return user;

	const setKeys = fields.map( field => `${field} = ?`).join(', ');
	const values = fields.map( field => (data as any)[field]);

	const sql = `UPDATE users SET ${setKeys} WHERE id = ?`;

	const stmt = context.db.prepare( sql );
	try{
		stmt.run( ...values, id );
	} catch( err: any ) {
		console.error( '\nlogged conflict error\n' );
		throw new ConflictError( 'Resource alredy in use' );
	}

	return user;
}

export function del(
        context: ServerContext,
        id: number
) {
	return userModel.del( context, id );
//	const stmt = context.db.prepare( 'DELETE FROM users WHERE  id = ?' );
//	const deletedUser = stmt.run( id );
//	
//	return true;
}
