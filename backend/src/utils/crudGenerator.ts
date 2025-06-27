import { Context } from '..context';

export function createCrud( tableName: string, context: Context ) {

	return {
		findAll: ( context: Context ) => {
			const stmt = context.db.prepare( `SELECT * FROM ${tableName}` );
			return stmt.all();
		},
		findById: ( context: Context, id: number ) => {
			const stmt = context.db.prepare( `SELECT * FROM ${tableName} WHERE id = ?` );
			return stmt.get( id );	
		},
		insert: ( context: Context, data: Record<string, any> ) => {

			const keys = Object.keys( data );

			const setKeys = keys.join( ', ' );
			const ph = keys.map( () => '?' ).join( ', ' );
			const sql = `INSERT INTO ${tableName} (${setKeys}) VALUES (${ph})`;
			console.log( `\n\n${sql}\n\n` )

			const stmt = context.db.prepare( sql );
			let result;
			try {
				result = stmt.run( ...Object.values( data ) );

				const sqlId = `SELECT * FROM ${tableName} WHERE id = ?`;
				const getStmt = context.db.prepare( sqlId );

				return getStmt.get( result.lastInsertRowid );
			} catch ( error ) {
				console.error( `Error inserting into ${tableName}:`, error );
				throw error;
			}
		},
		patch: ( context: Context, id: number, data: Record<string, any> ) => {

			const keys = Object.keys( data );

			const setKeys = keys.map( key => `${key} = ?` ).join( ', ' );
			const sql = `UPDATE ${tableName} SET ${setKeys} WHERE id = ?`;

			console.log( `\n\n${sql}\n\n` )
			const stmt = context.db.prepare( sql );
			try {
				console.log( `${Object.values( data )}\n\n` );
				return stmt.run( ...Object.values( data ), id );
			} catch ( error ) {
				console.error( `Error updating ${tableName} with id ${id}:`, error );
				throw error;
			}
		},
		del: ( context: Context, id: number ) => {
			const stmt = context.db.prepare( `DELETE FROM ${tableName} WHERE id = ?` );
			return stmt.run( id );
		}
	};
}
