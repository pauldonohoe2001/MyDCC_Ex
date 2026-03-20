const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { initSerial } = require('./src/dcc/serial');
const { handleMessage } = require('./src/websocket/handler');
const { getState } = require('./src/state/store');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// REST: snapshot of full state (for late-joining clients)
app.get('/api/state', (req, res) => res.json(getState()));

// WebSocket connections
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  ws.send(JSON.stringify({ type: 'state', payload: getState() }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(msg, ws, wss);
    } catch (e) {
      console.error('[WS] Bad message:', e.message);
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// Init DCC++ EX serial — broadcasts raw responses to all clients
const DCC_PORT = process.env.DCC_PORT || 'COM3';
initSerial(DCC_PORT, (line) => {
  broadcast(wss, { type: 'dcc_response', payload: line });
});

function broadcast(wss, message) {
  const json = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(json);
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`[DCC Centre] Server on http://localhost:${PORT}`));
