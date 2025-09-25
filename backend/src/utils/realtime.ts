import axios from 'axios';
import { gameType } from '../schemas/game';

const wsApiClient = axios.create({
  baseURL: 'http://[::1]:8081/api',
  timeout: 5000,
});

export async function sendGameStartRealtime(game: gameType): Promise<void> {
  try {
    await wsApiClient.post('/game/start', game);
  } catch (error) {
    console.error('Failed to send game start notification:', error);
  }
}

export async function notifyPlayer(
  reciever: string,
  message: string,
  sender?: string,
): Promise<void> {
  try {
    wsApiClient.post('/notify', {
      event: 'INFO',
      reciever: reciever,
      sender: sender,
      payload: { message: message },
    });
  } catch (error) {
    console.error('Failed to notify player:', error);
  }
}
