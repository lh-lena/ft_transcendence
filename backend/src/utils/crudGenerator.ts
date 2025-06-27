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
		del: ( context: Context, id: number ) => {
			const stmt = context.db.prepare( `DELETE FROM ${tableName} WHERE id = ?` );
			return stmt.run( id );
		}
	};
}
