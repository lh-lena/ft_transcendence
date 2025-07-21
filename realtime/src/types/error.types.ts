export enum ErrorServerMsg {
  REPLACED = 'replaced by new connection',
  SHUTDOWN = 'realtime server is shutting down',
  CONNECTION_LOST = 'connection lost',
}

export interface ServiceError {
  message: string;
}
