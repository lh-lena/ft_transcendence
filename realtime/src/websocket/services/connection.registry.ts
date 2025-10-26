import type { WSConnection } from 'fastify';
import type { ConnectionRegistry } from '../types/ws.types.js';
import type { UserIdType } from '../../schemas/user.schema.js';

export default function createConnectionRegistry(): ConnectionRegistry {
  const connections: Map<UserIdType, WSConnection> = new Map();

  function set(userId: UserIdType, connection: WSConnection): void {
    connections.set(userId, connection);
  }

  function get(userId: UserIdType): WSConnection | undefined {
    return connections.get(userId);
  }

  function getAll(): Map<UserIdType, WSConnection> {
    return new Map(connections);
  }

  function remove(userId: UserIdType): boolean {
    return connections.delete(userId);
  }

  function has(userId: UserIdType): boolean {
    return connections.has(userId);
  }

  function size(): number {
    return connections.size;
  }

  function clear(): void {
    connections.clear();
  }

  return {
    set,
    get,
    getAll,
    has,
    remove,
    size,
    clear,
  };
}
