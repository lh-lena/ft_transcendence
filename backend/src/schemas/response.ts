import { z } from "zod/v4";

const notFoundSchema = z.object({
  message: z.string().default("Resource not found"),
}).meta({ $id: "NotFound" })

const badRequestSchema = z.object({
  message: z.string().default("Bad request"),
}).meta({ $id: "BadRequest" })

const unauthorizedSchema = z.object({
  message: z.string().default("Unauthorized"),
}).meta({ $id: "Unauthorized" })

const forbiddenSchema = z.object({
  message: z.string().default("Forbidden"),
}).meta({ $id: "Forbidden" })

const createdSchema = z.object({
  message: z.string().default("Created"),
  id: z.number().optional(),
}).meta({ $id: "Created" })

const noContentSchema = z.object({
  message: z.string().default("No content"),
}) .meta({ $id: "NoContent" })

const deletedSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().default("Deleted successfully"),
}).meta({ $id: "Deleted" })

export const responseSchemas =  [
  notFoundSchema,
  badRequestSchema,
  unauthorizedSchema,
  forbiddenSchema,
  createdSchema,
  noContentSchema,
  deletedSchema,
]
