declare global {
  var chrome: any;
}

export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'privateKey';
  password?: string;
  privateKey?: string;
  passphrase?: string;
  relayUrl: string;
  relayToken: string;
  isDemo?: boolean;
}

export const DEFAULT_RELAY_URL = 'ws://localhost:8080';

export class Storage {
  static async getProfiles(): Promise<SSHProfile[]> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['profiles'], (result: any) => {
          resolve(result.profiles || []);
        });
      });
    }
    const data = localStorage.getItem('termPanel_profiles');
    return data ? JSON.parse(data) : [];
  }

  static async saveProfiles(profiles: SSHProfile[]): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.set({ profiles }, () => resolve());
      });
    }
    localStorage.setItem('termPanel_profiles', JSON.stringify(profiles));
  }
}
