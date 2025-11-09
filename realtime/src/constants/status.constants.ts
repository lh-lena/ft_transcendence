type StatusCodeType = {
  [key: string]: {
    code: number;
    reason: string;
  };
};

export const HTTPStatusCode: StatusCodeType = {
  UNAUTHORIZED: {
    code: 401,
    reason: 'Unauthorized',
  },
  INTERNAL_SERVER_ERROR: {
    code: 500,
    reason: 'Internal Server Error',
  },
};

export const WSStatusCode: StatusCodeType = {
  NORMAL_CLOSURE: {
    code: 1000,
    reason: 'Normal Closure',
  },
  REPLACED: {
    code: 1000,
    reason: 'Replaced by new connection',
  },
  GOING_AWAY: {
    code: 1001,
    reason: 'Realtime server is shutting down',
  },
  INVALID_PAYLOAD: {
    code: 1007,
    reason: 'Invalid Payload',
  },
  SERVICE_UNAVAILABLE: {
    code: 1011,
    reason: 'Max connections reached',
  },
  CONNECTION_LOST: {
    code: 1011,
    reason: 'Connection lost',
  },
  INTERNAL_SERVER_ERROR: {
    code: 1011,
    reason: 'Internal Server Error',
  },
};
