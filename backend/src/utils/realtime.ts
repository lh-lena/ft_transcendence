import axios from 'axios';
import { gameType } from '../schemas/game';

const realtimeip = process.env.REALTIME_IP || 'realtime';

const wsApiClient = axios.create({
  baseURL: `http://${realtimeip}:8081/api`,
  timeout: 5000,
});

export async function sendGameStartRealtime(game: gameType): Promise<void> {
  try {
    console.log(game);
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
      event: 'info',
      reciever: reciever,
      sender: sender,
      payload: { message: message },
    });
  } catch (error) {
    console.error('Failed to notify player:', error);
  }
}
