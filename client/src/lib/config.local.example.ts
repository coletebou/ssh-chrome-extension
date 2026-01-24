// Copy this file to config.local.ts and customize
// config.local.ts is gitignored - your secrets stay local
//
// These settings are baked into the build as defaults.
// You can still override them via the UI (stored in Chrome sync storage).

import type { TerminalConfig, DefaultProfile } from './config';

// Your server profiles for quick connect buttons
export const LOCAL_PROFILES: DefaultProfile[] = [
  {
    name: 'Hetzner',
    host: 'nebulatio-hz-prod',  // or IP/hostname
    port: 22,
    username: 'deploy',
    description: 'Production server',
  },
  {
    name: 'Home',
    host: 'cole-pc',
    port: 22,
    username: 'ctebou',
    description: 'Home dev machine',
  },
  {
    name: 'Work',
    host: 'roc-xe102101',
    port: 22,
    username: 'coletebou',
    description: 'Work laptop',
  },
];

// Override any default config values
export const LOCAL_CONFIG: Partial<TerminalConfig> = {
  // Relay server (required for SSH to work)
  relayUrl: 'ws://localhost:8080',
  relayToken: 'your-secret-token',

  // SSH defaults
  defaultUsername: 'ctebou',
  defaultAuthMethod: 'password',

  // Claude Code settings
  claudeStartDir: '~/code/Nebulatio2',
  claudeDefaultArgs: [],

  // Git worktree base (for worktree quick actions)
  worktreeBaseDir: '~/code/.worktrees',

  // UI preferences
  fontSize: 14,
  theme: 'dark',
  showQuickActions: true,

  // Add custom snippets (merged with defaults)
  // snippets: [
  //   { id: 'my-cmd', name: 'My Command', command: 'echo hello', icon: '👋', category: 'custom' },
  // ],
};
