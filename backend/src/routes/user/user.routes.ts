import { FastifyInstance } from 'fastify';
import * as ServerContext from '../createContext';
import { z } from 'zod';

import * as userController from './user.controller';

import { 
  CreateuserSchema,
  UpdateuserSchema,
  ResponseuserSchema,
  DeleteuserSchema,
  userIdSchema,
  userQuerySchema
} from './user.schema';

export function userRoutes( context: ServerContext ) {
  return async function( server: FastifyInstance ) {

    const context = ServerContext.createContext( server );

    server.get( '/user', { 
      schema: {
         querystring: userQuerySchema , 
         response: { 
           200: z.array( ResponseuserSchema ),
         },
         summary: "Get all or queryed Users",
       }
       }, async ( request, reply ) => {
         await userController.getAllorFiltereduser( context, request, reply );
       } );

    server.get( '/user/:id',
               { schema: {
                 params: userIdSchema ,
                 response: {
                   200: ResponseuserSchema ,
                   404: z.object( { message: z.string() } ) ,
                 },
                 summary: "User by ID",
               }
               }, async ( request, reply ) => {          
                 await userController.getuserById( context, request, reply ) 
               } );

    server.post( '/user', 
                { schema: {
                  body: CreateuserSchema ,
                  response: {
                    201: ResponseuserSchema ,
                  },
                  summary: "Created new User",
                }
                }, async ( request, reply ) => {            
                  await userController.createuser( context, request, reply ) 
                } );

    server.patch( '/user/:id', 
                 { schema: {
                   body: UpdateuserSchema ,
                   response: {
                     200: ResponseuserSchema ,
                   },
                   summary: "Updated User",
                 }
                 }, async ( request, reply ) => {
                   await userController.updateuser( context, request, reply ) 
                 } );

    server.delete( '/user/:id', 
                  { schema: {
                    params: userIdSchema ,
                    response: {
                      200: z.object( { message: z.string() } ) ,
                      404: z.object( { message: z.string() } ) ,
                    },
                    summary: "Deleted User",
                  }
                  }, async( request, reply ) => {
                    await userController.removeuser( context, request, reply ) 
                  } );

    };
  }
