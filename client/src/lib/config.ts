// Nebula Terminal Configuration System
// This file can be edited directly or via the UI

export interface TerminalConfig {
  // Default connection settings
  defaultProfile?: string;

  // Relay server settings
  relayUrl: string;
  relayToken: string;

  // SSH defaults
  defaultPort: number;
  defaultUsername: string;
  defaultAuthMethod: 'password' | 'privateKey';

  // Claude Code settings
  claudeStartDir: string;
  claudeDefaultArgs: string[];

  // Git worktrees
  worktreeBaseDir: string;

  // UI preferences
  fontSize: number;
  theme: 'dark' | 'light' | 'system';
  showQuickActions: boolean;

  // Quick command snippets
  snippets: CommandSnippet[];

  // Session settings
  persistSessions: boolean;
  maxSessions: number;

  // Keyboard shortcuts
  shortcuts: KeyboardShortcuts;
}

export interface CommandSnippet {
  id: string;
  name: string;
  command: string;
  icon?: string;
  category: 'claude' | 'git' | 'tmux' | 'system' | 'custom';
}

export interface KeyboardShortcuts {
  newSession: string;
  closeSession: string;
  nextSession: string;
  prevSession: string;
  toggleVoice: string;
  uploadImage: string;
  takeScreenshot: string;
  toggleConnectionManager: string;
  runClaude: string;
  runClaudeYolo: string;
  gitCommit: string;
  gitPush: string;
}

// Default profiles for quick access
export interface DefaultProfile {
  name: string;
  host: string;
  port: number;
  username: string;
  description?: string;
}

export const DEFAULT_PROFILES: DefaultProfile[] = [
  {
    name: 'Hetzner Server',
    host: '100.71.192.25',
    port: 22,
    username: 'deploy',
    description: 'nebulatio-hz-prod - Production server'
  },
  {
    name: 'Home Desktop',
    host: '100.115.178.39',
    port: 22,
    username: 'ctebou',
    description: 'cole-pc - Home dev machine (WSL)'
  },
  {
    name: 'Work Laptop',
    host: '100.95.16.127',
    port: 22,
    username: 'coletebou',
    description: 'roc-xe102101 - Work laptop (WSL)'
  },
];

export const DEFAULT_CONFIG: TerminalConfig = {
  relayUrl: 'ws://localhost:8080',
  relayToken: 'my-secret-token',

  defaultPort: 22,
  defaultUsername: 'deploy',
  defaultAuthMethod: 'password',

  claudeStartDir: '~/code/Nebulatio2',
  claudeDefaultArgs: [],

  worktreeBaseDir: '~/code/worktrees',

  fontSize: 14,
  theme: 'dark',
  showQuickActions: true,

  snippets: [
    { id: 'claude', name: 'Claude Code', command: 'claude', icon: '🤖', category: 'claude' },
    { id: 'claude-yolo', name: 'Claude YOLO', command: 'claude --dangerously-skip-permissions', icon: '🚀', category: 'claude' },
    { id: 'claude-resume', name: 'Claude Resume', command: 'claude --resume', icon: '▶️', category: 'claude' },
    { id: 'tmux-new', name: 'tmux new', command: 'tmux new -s main', icon: '📺', category: 'tmux' },
    { id: 'tmux-attach', name: 'tmux attach', command: 'tmux a -t main', icon: '🔗', category: 'tmux' },
    { id: 'tmux-list', name: 'tmux list', command: 'tmux ls', icon: '📋', category: 'tmux' },
    { id: 'git-status', name: 'git status', command: 'git status', icon: '📊', category: 'git' },
    { id: 'git-commit', name: 'git commit', command: 'git add -A && git commit -m "WIP"', icon: '💾', category: 'git' },
    { id: 'git-push', name: 'git push', command: 'git push', icon: '⬆️', category: 'git' },
    { id: 'git-pull', name: 'git pull', command: 'git pull', icon: '⬇️', category: 'git' },
    { id: 'htop', name: 'htop', command: 'htop', icon: '📈', category: 'system' },
    { id: 'df', name: 'Disk Usage', command: 'df -h', icon: '💾', category: 'system' },
  ],

  persistSessions: true,
  maxSessions: 10,

  shortcuts: {
    newSession: 'Ctrl+Shift+T',
    closeSession: 'Ctrl+Shift+W',
    nextSession: 'Ctrl+Tab',
    prevSession: 'Ctrl+Shift+Tab',
    toggleVoice: 'Ctrl+Shift+V',
    uploadImage: 'Ctrl+Shift+U',
    takeScreenshot: 'Ctrl+Shift+S',
    toggleConnectionManager: 'Ctrl+Shift+C',
    runClaude: 'Ctrl+Shift+A',
    runClaudeYolo: 'Ctrl+Shift+Y',
    gitCommit: 'Ctrl+Shift+G',
    gitPush: 'Ctrl+Shift+P',
  },
};

const CONFIG_KEY = 'nebula_terminal_config';

export class ConfigManager {
  private static config: TerminalConfig | null = null;

  static async load(): Promise<TerminalConfig> {
    if (this.config) return this.config;

    // Try Chrome storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.get([CONFIG_KEY], (result: Record<string, unknown>) => {
          const stored = result[CONFIG_KEY] as Partial<TerminalConfig> | undefined;
          this.config = { ...DEFAULT_CONFIG, ...stored };
          resolve(this.config);
        });
      });
    }

    // Fall back to localStorage
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch {
        this.config = DEFAULT_CONFIG;
      }
    } else {
      this.config = DEFAULT_CONFIG;
    }

    return this.config!;
  }

  static async save(config: Partial<TerminalConfig>): Promise<void> {
    this.config = { ...DEFAULT_CONFIG, ...(this.config ?? {}), ...config };

    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.set({ [CONFIG_KEY]: this.config }, () => resolve());
      });
    }

    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  }

  static async reset(): Promise<void> {
    this.config = DEFAULT_CONFIG;

    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.remove([CONFIG_KEY], () => resolve());
      });
    }

    localStorage.removeItem(CONFIG_KEY);
  }

  static getDefault(): TerminalConfig {
    return DEFAULT_CONFIG;
  }

  // Export config as JSON for editing
  static exportConfig(): string {
    return JSON.stringify(this.config ?? DEFAULT_CONFIG, null, 2);
  }

  // Import config from JSON
  static async importConfig(json: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(json);
      await this.save(parsed);
      return true;
    } catch {
      return false;
    }
  }
}
