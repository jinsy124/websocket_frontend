const WebSocket = require('ws');
console.log('Connecting with only token...');
const ws = new WebSocket('ws://localhost:8000/ws?token=test');
ws.on('error', (e) => console.log('Error:', e.message));
ws.on('close', (code, reason) => console.log('Closed:', code, reason.toString()));
