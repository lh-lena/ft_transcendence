export class GameError extends Error {
  constructor(
    message: string,
    public error?: unknown,
  ) {
    super(message);
    this.name = 'GameError';
  }
}
