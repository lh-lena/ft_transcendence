import type { WSConnection } from 'fastify';
import type { ConnectionRegistry } from '../types/ws.types.js';

export default function createConnectionRegistry(): ConnectionRegistry {
  const connections: Map<number, WSConnection> = new Map();

  function set(userId: number, connection: WSConnection): void {
    connections.set(userId, connection);
  }

  function get(userId: number): WSConnection | undefined {
    return connections.get(userId);
  }

  function getAll(): Map<number, WSConnection> {
    return new Map(connections);
  }

  function remove(userId: number): boolean {
    return connections.delete(userId);
  }

  function has(userId: number): boolean {
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
