import axios from 'axios';

const wsApiClient = axios.create({
  baseURL: 'http://[::1]:8081',
  timeout: 5000,
});

export async function notifyPlayer(reciver: string, message: string): Promise<void> {
  try {
    wsApiClient.post('/notify', {
      event: 'INFO',
      reciver: reciver,
      payload: { message: message },
    });
  } catch (error) {
    console.error('Failed to notify player:', error);
  }
}
