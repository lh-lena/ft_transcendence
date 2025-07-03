import { Context } from '..context';

export function createCrud( tableName: string, context: Context ) {

	return {
		findAll: () => {
			const stmt = context.db.prepare( `SELECT * FROM ${tableName}` );
			return stmt.all();
		},
		findById: ( id: string | number ) => {
			const stmt = context.db.prepare( `SELECT * FROM ${tableName} WHERE id = ?` );
			return stmt.get( id );	
		},
		findBy: ( filters: Record<string, any> ) => {
			const keys = Object.keys( filters );

			const whereClause = keys.map( key => `${key} = ?` ).join( ' AND ' );
			const sql = `SELECT * FROM ${tableName} WHERE ${whereClause}`;	

			const stmt = context.db.prepare( sql );
			return stmt.all( ...Object.values( filters ) );
		},
		insert: ( data: Record<string, any> ) => {

			const keys = Object.keys( data );

			const setKeys = keys.join( ', ' );
			const ph = keys.map( () => '?' ).join( ', ' );
			const sql = `INSERT INTO ${tableName} (${setKeys}) VALUES (${ph})`;

			const stmt = context.db.prepare( sql );
			let result;

			try {
				result = stmt.run( ...Object.values( data ) );

				const getId = result.lastInsertRowid ?? data.id;

				const sqlId = `SELECT * FROM ${tableName} WHERE id = ?`;
				const getStmt = context.db.prepare( sqlId );

				return getStmt.get( getId );
			} catch ( error ) {
				console.error( `Error inserting into ${tableName}:`, error );
				throw error;
			}
		},
		patch: ( id: string | number, data: Record<string, any> ) => {

			const keys = Object.keys( data );

			const setKeys = keys.map( key => `${key} = ?` ).join( ', ' );
			const sql = `UPDATE ${tableName} SET ${setKeys} WHERE id = ?`;

			const stmt = context.db.prepare( sql );

			try {
				return stmt.run( ...Object.values( data ), id );
			} catch ( error ) {
				console.error( `Error updating ${tableName} with id ${id}:`, error );
				throw error;
			}
		},
		remove: ( id: string | number ) => {
			const stmt = context.db.prepare( `DELETE FROM ${tableName} WHERE id = ?` );
			return stmt.run( id );
		}
	};
}
