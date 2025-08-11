import { z } from 'zod/v4';

const internalError = z
  .object({
    statusCode: z.number().default(500),
    code: z.string().default('INTERNAL_ERROR'),
    message: z.string().default('Internal server error'),
  })
  .meta({ $id: 'InternalError' });

const notFoundSchema = z
  .object({
    statusCode: z.number().default(404),
    code: z.string().default('NOT_FOUND'),
    message: z.string().default('Resource not found'),
  })
  .meta({ $id: 'NotFound' });

const badRequestSchema = z
  .object({
    statusCode: z.number().default(400),
    code: z.string().default('BAD_REQUEST'),
    message: z.string().default('Bad request'),
  })
  .meta({ $id: 'BadRequest' });

const validationSchema = z
  .object({
    statusCode: z.number().default(422),
    code: z.string().default('VALIDATION_ERROR'),
    message: z.string().default('Validation error'),
  })
  .meta({ $id: 'ValidationError' });

const unauthorizedSchema = z
  .object({
    message: z.string().default('Unauthorized'),
  })
  .meta({ $id: 'Unauthorized' });

const forbiddenSchema = z
  .object({
    message: z.string().default('Forbidden'),
  })
  .meta({ $id: 'Forbidden' });

const createdSchema = z
  .object({
    message: z.string().default('Created'),
    id: z.number().optional(),
  })
  .meta({ $id: 'Created' });

const noContentSchema = z
  .object({
    message: z.string().default('No content'),
  })
  .meta({ $id: 'NoContent' });

const deletedSchema = z
  .object({
    success: z.boolean().default(true),
    message: z.string().default('Deleted successfully'),
  })
  .meta({ $id: 'Deleted' });

export const responseSchemas = [
  internalError,
  notFoundSchema,
  badRequestSchema,
  validationSchema,
  unauthorizedSchema,
  forbiddenSchema,
  createdSchema,
  noContentSchema,
  deletedSchema,
];
