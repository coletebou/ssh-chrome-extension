// Session persistence for Nebula Terminal
import { SSHProfile } from './storage';

export interface PersistedSession {
  id: string;
  profileId: string;
  profile: SSHProfile;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  isDemo: boolean;
}

const SESSIONS_KEY = 'nebula_terminal_sessions';
const ACTIVE_SESSION_KEY = 'nebula_terminal_active_session';

export class SessionStorage {
  static async getSessions(): Promise<PersistedSession[]> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([SESSIONS_KEY], (result: Record<string, unknown>) => {
          resolve((result[SESSIONS_KEY] as PersistedSession[]) || []);
        });
      });
    }

    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static async saveSessions(sessions: PersistedSession[]): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [SESSIONS_KEY]: sessions }, () => resolve());
      });
    }

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  static async addSession(session: PersistedSession): Promise<void> {
    const sessions = await this.getSessions();
    sessions.push(session);
    await this.saveSessions(sessions);
  }

  static async removeSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await this.saveSessions(filtered);
  }

  static async updateSession(sessionId: string, updates: Partial<PersistedSession>): Promise<void> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index >= 0) {
      sessions[index] = { ...sessions[index], ...updates };
      await this.saveSessions(sessions);
    }
  }

  static async getActiveSessionId(): Promise<string | null> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([ACTIVE_SESSION_KEY], (result: Record<string, unknown>) => {
          resolve((result[ACTIVE_SESSION_KEY] as string) || null);
        });
      });
    }

    return localStorage.getItem(ACTIVE_SESSION_KEY);
  }

  static async setActiveSessionId(sessionId: string | null): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        if (sessionId) {
          chrome.storage.local.set({ [ACTIVE_SESSION_KEY]: sessionId }, () => resolve());
        } else {
          chrome.storage.local.remove([ACTIVE_SESSION_KEY], () => resolve());
        }
      });
    }

    if (sessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }

  static async clearAllSessions(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([SESSIONS_KEY, ACTIVE_SESSION_KEY], () => resolve());
      });
    }

    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

// Worktree management
export interface GitWorktree {
  id: string;
  name: string;
  path: string;
  branch: string;
  createdAt: number;
  associatedSessionIds: string[];
}

const WORKTREES_KEY = 'nebula_terminal_worktrees';

export class WorktreeStorage {
  static async getWorktrees(): Promise<GitWorktree[]> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([WORKTREES_KEY], (result: Record<string, unknown>) => {
          resolve((result[WORKTREES_KEY] as GitWorktree[]) || []);
        });
      });
    }

    const stored = localStorage.getItem(WORKTREES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static async saveWorktrees(worktrees: GitWorktree[]): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [WORKTREES_KEY]: worktrees }, () => resolve());
      });
    }

    localStorage.setItem(WORKTREES_KEY, JSON.stringify(worktrees));
  }

  static async addWorktree(worktree: GitWorktree): Promise<void> {
    const worktrees = await this.getWorktrees();
    worktrees.push(worktree);
    await this.saveWorktrees(worktrees);
  }

  static async removeWorktree(worktreeId: string): Promise<void> {
    const worktrees = await this.getWorktrees();
    const filtered = worktrees.filter(w => w.id !== worktreeId);
    await this.saveWorktrees(filtered);
  }

  static async associateSession(worktreeId: string, sessionId: string): Promise<void> {
    const worktrees = await this.getWorktrees();
    const worktree = worktrees.find(w => w.id === worktreeId);
    if (worktree && !worktree.associatedSessionIds.includes(sessionId)) {
      worktree.associatedSessionIds.push(sessionId);
      await this.saveWorktrees(worktrees);
    }
  }
}
