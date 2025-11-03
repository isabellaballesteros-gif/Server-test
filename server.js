const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Track connected users for WebSocket simulation
let connectedUsers = 0;
let clients = new Map();

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper function to get MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'text/plain';
}

// Simple WebSocket-like functionality using Server-Sent Events
function handleSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const clientId = Date.now() + Math.random();
  connectedUsers++;
  
  // Send initial user count
  res.write(`data: ${JSON.stringify({ type: 'userCount', count: connectedUsers })}\n\n`);
  
  // Store client
  clients.set(clientId, res);
  
  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      clients.delete(clientId);
      connectedUsers--;
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
    connectedUsers--;
    broadcastUserCount();
  });
}

// Broadcast user count to all clients
function broadcastUserCount() {
  const message = `data: ${JSON.stringify({ type: 'userCount', count: connectedUsers })}\n\n`;
  clients.forEach(client => {
    if (!client.writableEnded) {
      client.write(message);
    }
  });
}

// Broadcast message to all clients except sender
function broadcastMessage(message, timestamp, excludeClient = null) {
  const data = JSON.stringify({ type: 'message', message, timestamp });
  const sseMessage = `data: ${data}\n\n`;
  
  clients.forEach((client, clientId) => {
    if (client !== excludeClient && !client.writableEnded) {
      client.write(sseMessage);
    }
  });
}

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle Server-Sent Events for real-time communication
  if (pathname === '/events') {
    handleSSE(req, res);
    return;
  }

  // Handle message posting
  if (pathname === '/message' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const timestamp = new Date().toLocaleTimeString();
        broadcastMessage(data.message, timestamp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  // Security check - prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Open multiple browser tabs to test real-time communication!`);
  console.log(`📄 Serving HTML page with Server-Sent Events for real-time updates`);
});

module.exports = server;
