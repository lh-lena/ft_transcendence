import axios from 'axios';

const wsApiClient = axios.create({
  baseURL: 'https://localhost:8081/api',
  timeout: 5000,
});

export async function notifyPlayer(
  reciver: string,
  sender: string,
  message: string,
): Promise<void> {
  wsApiClient.post('/notify', {
    event: 'INFO',
    reciver: reciver,
    sender: sender,
    payload: { message: message },
  });
}
