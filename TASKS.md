# Nebula Terminal - Implementation Tasks

## Status: Iteration 1 - Core Features Complete

### Completed Features

#### 1. Configurable SSH Connection
- [x] Password authentication
- [x] Private key authentication (PEM/OpenSSH)
- [x] Configurable port, IP address, username
- [x] Editable JSON config file with import/export
- [x] UI fields for all connection settings
- [x] Quick connect buttons for default profiles (Hetzner, Home, Work)

#### 2. Quick Action Buttons
- [x] Claude Code (normal mode)
- [x] Claude Code --dangerously-skip-permissions (YOLO mode)
- [x] Claude --resume
- [x] tmux commands (new, attach, list, kill)
- [x] Git commands (status, commit, push, pull)
- [x] Git worktree support
- [x] htop and system commands
- [x] Custom configurable snippets

#### 3. Voice Input Mode
- [x] Web Speech API integration
- [x] Toggle button with visual feedback
- [x] Continuous listening mode
- [x] Auto-restart on pause

#### 4. Keyboard Shortcuts
- [x] Ctrl+Shift+T: New session
- [x] Ctrl+Shift+W: Close session
- [x] Ctrl+Tab: Next session
- [x] Ctrl+Shift+Tab: Previous session
- [x] Ctrl+Shift+V: Toggle voice
- [x] Ctrl+Shift+U: Upload image
- [x] Ctrl+Shift+S: Take screenshot
- [x] Ctrl+Shift+C: Toggle connection manager
- [x] Ctrl+Shift+A: Run Claude
- [x] Ctrl+Shift+Y: Run Claude YOLO
- [x] Ctrl+Shift+G: Git commit
- [x] Ctrl+Shift+P: Git push

#### 5. Multi-Session Support
- [x] Tab bar for multiple sessions
- [x] Session switching with keyboard shortcuts
- [x] Three view modes: single, grid, overview
- [x] Session persistence across browser restarts
- [x] Connection status indicators

#### 6. Profile Management
- [x] Multiple saved profiles
- [x] Quick connect for default servers
- [x] Profile persistence in Chrome storage/localStorage
- [x] Import/export profiles

#### 7. Configuration System
- [x] JSON config editor
- [x] Quick settings UI
- [x] Export/import configuration
- [x] Reset to defaults
- [x] Persistent settings

#### 8. File Upload Features
- [x] Image upload to terminal session
- [x] Screenshot capture using Screen Capture API
- [x] File upload infrastructure (relay server support needed)

#### 9. Terminal Features
- [x] xterm.js with fit addon
- [x] Search addon
- [x] Web links addon
- [x] Custom color theme
- [x] Demo mode with simulated shell

---

## Files Created/Modified

### New Files
- `client/src/lib/config.ts` - Configuration management with defaults
- `client/src/lib/mock-relay.ts` - Demo mode simulation
- `client/src/lib/session-storage.ts` - Session persistence
- `client/src/hooks/use-voice-input.ts` - Voice input hook
- `client/src/hooks/use-keyboard-shortcuts.ts` - Keyboard shortcuts
- `client/src/hooks/use-file-upload.ts` - File upload handling
- `client/src/components/QuickActions.tsx` - Quick action toolbar
- `TASKS.md` - This task tracking file

### Modified Files
- `client/src/App.tsx` - Main app with all integrations
- `client/src/components/Terminal.tsx` - Added search addon
- `client/src/components/ConnectionManager.tsx` - Added quick connect, settings tab
- `client/src/lib/storage.ts` - Added isDemo flag
- `client/public/manifest.json` - Updated branding
- `package.json` - Added dependencies

---

## Setup Instructions

1. Install dependencies:
```bash
# Using bun (recommended)
bun install

# Using npm
npm install
```

2. Start relay server:
```bash
cd relay-server

# Using bun
bun install && bun start

# Using npm
npm install && npm start
```

3. Build extension:
```bash
bun run build   # or: npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `dist/public` folder

---

## Architecture

```
Chrome Extension (React + xterm.js)
    ↓ WebSocket
Relay Server (Node.js + ssh2)
    ↓ SSH
Remote Server
```

---

## Next Steps (Future Iterations)

- [ ] Add more htop-like capabilities (process list in overlay)
- [ ] Add drag-and-drop file upload
- [ ] Add clipboard sync between sessions
- [ ] Add session recording/playback
- [ ] Add command history search
- [ ] Add split pane views
- [ ] Add SSH agent forwarding
- [ ] Add port forwarding UI
