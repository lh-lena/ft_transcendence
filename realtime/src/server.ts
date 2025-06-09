// realtime/src/server.ts
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'WebSocket server running on port 8081' 
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(8081, () => {
  console.log('Realtime server listening on port 8081');
});