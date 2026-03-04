import * as net from 'net';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GT06Decoder } from './protocols/gt06';
import { TK103Decoder } from './protocols/tk103';
import { H02Decoder } from './protocols/h02';
import { PositionBuffer } from './buffer';

const PORTS = {
  GT06: 5000,
  TK103: 5001,
  H02: 5002,
  WEBSOCKET: 4000,
};

const decoders = {
  gt06: new GT06Decoder(),
  tk103: new TK103Decoder(),
  h02: new H02Decoder(),
};

const positionBuffer = new PositionBuffer();

// GT06 Server (Concox, Meitrack)
const gt06Server = net.createServer((socket) => {
  console.log(`[GT06] Device connected: ${socket.remoteAddress}:${socket.remotePort}`);
  
  socket.on('data', (data) => {
    try {
      const result = decoders.gt06.decode(data);
      if (result) {
        console.log('[GT06] Decoded:', result);
        positionBuffer.add(result);
        
        // Send response if needed
        if (result.response) {
          socket.write(result.response);
        }
      }
    } catch (error) {
      console.error('[GT06] Decode error:', error.message);
    }
  });

  socket.on('error', (err) => {
    console.error('[GT06] Socket error:', err.message);
  });

  socket.on('close', () => {
    console.log('[GT06] Device disconnected');
  });
});

// TK103 Server (Coban, Xexun)
const tk103Server = net.createServer((socket) => {
  console.log(`[TK103] Device connected: ${socket.remoteAddress}:${socket.remotePort}`);
  
  let imei: string | null = null;

  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log('[TK103] Raw:', message);

    try {
      // Handle IMEI login
      if (message.startsWith('##')) {
        const result = decoders.tk103.decodeLogin(message);
        if (result) {
          imei = result.imei;
          console.log('[TK103] Device login:', imei);
          socket.write('LOAD'); // Acknowledge
        }
        return;
      }

      // Handle position data
      if (imei && message.startsWith('imei:')) {
        const result = decoders.tk103.decodePosition(message, imei);
        if (result) {
          console.log('[TK103] Position:', result);
          positionBuffer.add(result);
        }
      }
    } catch (error) {
      console.error('[TK103] Decode error:', error.message);
    }
  });

  socket.on('error', (err) => {
    console.error('[TK103] Socket error:', err.message);
  });
});

// H02 Server (Chinese clones)
const h02Server = net.createServer((socket) => {
  console.log(`[H02] Device connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    try {
      const result = decoders.h02.decode(data);
      if (result) {
        console.log('[H02] Decoded:', result);
        positionBuffer.add(result);
      }
    } catch (error) {
      console.error('[H02] Decode error:', error.message);
    }
  });

  socket.on('error', (err) => {
    console.error('[H02] Socket error:', err.message);
  });
});

// WebSocket for real-time position streaming
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Send buffered positions
  const positions = positionBuffer.getRecent(100);
  ws.send(JSON.stringify({ type: 'history', data: positions }));

  // Subscribe to new positions
  const unsubscribe = positionBuffer.subscribe((position) => {
    ws.send(JSON.stringify({ type: 'position', data: position }));
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    unsubscribe();
  });
});

// Start all servers
gt06Server.listen(PORTS.GT06, () => {
  console.log(`✅ GT06 server listening on port ${PORTS.GT06}`);
});

tk103Server.listen(PORTS.TK103, () => {
  console.log(`✅ TK103 server listening on port ${PORTS.TK103}`);
});

h02Server.listen(PORTS.H02, () => {
  console.log(`✅ H02 server listening on port ${PORTS.H02}`);
});

httpServer.listen(PORTS.WEBSOCKET, () => {
  console.log(`✅ WebSocket server listening on port ${PORTS.WEBSOCKET}`);
});

console.log(`
🛰️ GPS-Free-SaaS Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GT06:   Port ${PORTS.GT06}
TK103:  Port ${PORTS.TK103}
H02:    Port ${PORTS.H02}
WS:     Port ${PORTS.WEBSOCKET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
