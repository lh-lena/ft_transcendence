import { FastifyInstance } from 'fastify';
import { ServerContext } from '../context';
import { z } from 'zod';
import * as userController from '../database/user/user.controller';
import { CreateUserSchema, UpdateUserSchema } from '../database/user/user.schema';

export function userRoutes( context: ServerContext ) {
	return async function( server: FastifyInstance ) {

		server.get( '/user', { 
			schema: {
				response: { 
					200: z.array( CreateUserSchema.extend( { id: z.number() } ) )
						}
					}
				}, async ( request, reply ) => {
			await userController.getAllorFiltereduser( context, request, reply );
		} );

		server.get( '/user/:id', {
      schema: {
        params: { id: z.number() },
        response: {
          200: z.object( CreateUserSchema.extend( { id: z.number() } ) )
              }
            }
          }, async ( request, reply ) => {          
			  await userController.getuserById( context, request, reply ) 
    } );

		server.post( '/user', {
      schema: {
        body: CreateUserSchema,
        response: {
          201: z.object( CreateUserSchema.extend( { id: z.number() } ) )
        }
      }
    }, async ( request, reply ) => {            
			await userController.createuser( context, request, reply ) 
    } );

		server.patch( '/user/:id', {
      schema: {
        params: { id: z.number () },
        body: UpdateUserSchema,
        response: {
          200: CreateUserSchema.extend( { id: z.number() } )
        }
      } 
    }, async ( request, reply ) => {
			await userController.updateuser( context, request, reply ) 
    } );

		server.delete( '/user/:id', {
    schema: {
      params: z.object( { id: z.number() } ),
      response: {
        204: z.void()
      }
    }
    }, async( request, reply ) => {
			await userController.removeuser( context, request, reply ) } );

	};
}
