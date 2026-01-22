# Nebula Terminal

SSH terminal Chrome extension with WebSocket relay.

## Quick Start

```bash
bun install              # Install dependencies
bun run dev:client       # Start dev server (http://localhost:5000)
bun run build            # Build for production
bun run check            # TypeScript check
```

## Architecture

```
Chrome Extension (React + xterm.js)
    ↓ WebSocket
Relay Server (Node.js + ssh2)
    ↓ SSH
Remote Server
```

## Key Directories

| Path | Purpose |
|------|---------|
| `client/src/` | React frontend |
| `client/src/components/` | UI components (Terminal, ConnectionManager, QuickActions) |
| `client/src/lib/` | Core logic (config, storage, ssh-client, mock-relay) |
| `client/src/hooks/` | React hooks (voice-input, keyboard-shortcuts, file-upload) |
| `relay-server/` | WebSocket relay server |
| `dist/public/` | Built extension (load in Chrome) |

## Features

- Multi-session terminal with tabs
- Password & private key SSH authentication
- Quick actions: Claude Code, tmux, git operations
- Voice input via Web Speech API
- Screenshot capture & image upload
- Keyboard shortcuts (Ctrl+Shift+T for new session, etc.)
- Session persistence across browser restarts
- Git worktree management
- Three view modes: single, grid, overview

## Default Profiles

| Name | Host | User |
|------|------|------|
| Hetzner Server | 100.71.192.25 | deploy |
| Home Desktop | 100.115.178.39 | ctebou |
| Work Laptop | 100.95.16.127 | coletebou |

## Load in Chrome

1. Build: `bun run build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Click "Load unpacked"
5. Select `dist/public/`

## Relay Server

The relay server bridges WebSocket connections to SSH:

```bash
cd relay-server
npm install
npm start  # Runs on port 8080
```

Set relay URL in connection settings (default: `ws://localhost:8080`).
