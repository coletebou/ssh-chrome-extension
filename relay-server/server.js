const WebSocket = require('ws');
const { Client } = require('ssh2');
const http = require('http');

// Configuration - MUST set AUTH_TOKEN environment variable
const PORT = process.env.PORT || 8080;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('ERROR: AUTH_TOKEN environment variable is required');
  console.error('Set it with: AUTH_TOKEN=your-secret-token node server.js');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TermPanel Relay Server is running.\n');
});

const wss = new WebSocket.Server({ server });

console.log(`Nebula Terminal Relay Server running on port ${PORT}`);
console.log('Auth token configured (not shown for security)');

wss.on('connection', (ws) => {
  let sshClient = null;
  let stream = null;
  let isAuthenticated = false;

  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (!isAuthenticated) {
        if (data.type === 'auth' && data.token === AUTH_TOKEN) {
          isAuthenticated = true;
          ws.send(JSON.stringify({ type: 'auth-success' }));
          console.log('Client authenticated');
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid auth token' }));
          ws.close();
        }
        return;
      }

      if (data.type === 'connect') {
        if (sshClient) return; // Already connected

        console.log(`Connecting to ${data.host}:${data.port || 22} as ${data.username}`);
        
        sshClient = new Client();

        sshClient.on('ready', () => {
          console.log('SSH connection ready');
          ws.send(JSON.stringify({ type: 'connected' }));

          sshClient.shell({ term: 'xterm-256color' }, (err, s) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', message: 'Shell error: ' + err.message }));
              return;
            }
            
            stream = s;

            // Pipe SSH output to WebSocket
            stream.on('data', (d) => {
              ws.send(JSON.stringify({ type: 'data', data: d.toString('base64') }));
            });

            stream.on('close', () => {
              console.log('SSH stream closed');
              ws.send(JSON.stringify({ type: 'disconnected' }));
              ws.close();
            });
          });
        });

        sshClient.on('error', (err) => {
          console.error('SSH Error:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'SSH Error: ' + err.message }));
        });

        sshClient.on('close', () => {
          console.log('SSH Client closed');
          ws.send(JSON.stringify({ type: 'disconnected' }));
        });

        const connectConfig = {
          host: data.host,
          port: parseInt(data.port) || 22,
          username: data.username,
        };

        if (data.authMethod === 'password') {
          connectConfig.password = data.password;
        } else if (data.authMethod === 'privateKey') {
          connectConfig.privateKey = data.privateKey;
          if (data.passphrase) connectConfig.passphrase = data.passphrase;
        }

        try {
          sshClient.connect(connectConfig);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', message: 'Connect Error: ' + e.message }));
        }
      
      } else if (data.type === 'data') {
        if (stream) {
          stream.write(data.data); // Raw string data from client
        }
      } else if (data.type === 'resize') {
        if (stream) {
          stream.setWindow(data.rows, data.cols, data.height, data.width);
        }
      }

    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
    if (sshClient) sshClient.end();
  });
});

server.listen(PORT);
