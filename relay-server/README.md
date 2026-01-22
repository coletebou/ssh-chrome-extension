# TermPanel Relay Server

This Node.js server acts as a bridge between the TermPanel Chrome Extension and your remote SSH servers.

## Why is this needed?
Chrome Extensions cannot make raw TCP connections required for SSH. They can only use WebSockets. This relay translates WebSocket traffic to SSH.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configuration**:
   - You can set environment variables or edit `server.js` directly.
   - `PORT`: The port the relay listens on (default: 8080).
   - `AUTH_TOKEN`: A secret token you create. You MUST enter this in the Chrome Extension to connect.

3. **Run**:
   ```bash
   npm start
   ```
   Or:
   ```bash
   AUTH_TOKEN=super-secret-password npm start
   ```

4. **Security**:
   - **Highly Recommended**: Run this behind a reverse proxy (Nginx, Caddy) with SSL (wss://).
   - If running locally for testing, `ws://localhost:8080` works.
   - Do not expose this port publicly without `AUTH_TOKEN` and preferably SSL.

## Connecting from Extension
1. Open TermPanel Side Panel.
2. Go to Settings/Connect.
3. Relay URL: `ws://localhost:8080` (or your public domain).
4. Relay Token: The `AUTH_TOKEN` you set above.
5. Enter your SSH Host/User/Creds.
