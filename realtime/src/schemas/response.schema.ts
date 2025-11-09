export const ResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['success'],
};

export type Response = {
  success: boolean;
  message: string;
};
