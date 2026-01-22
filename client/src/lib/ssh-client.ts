import { SSHProfile } from "./storage";

export class SSHClient {
  private ws: WebSocket | null = null;
  private profile: SSHProfile;
  private onData: (data: string) => void;
  private onStatus: (status: string) => void;
  private onError: (error: string) => void;

  constructor(
    profile: SSHProfile,
    callbacks: {
      onData: (data: string) => void;
      onStatus: (status: string) => void;
      onError: (error: string) => void;
    }
  ) {
    this.profile = profile;
    this.onData = callbacks.onData;
    this.onStatus = callbacks.onStatus;
    this.onError = callbacks.onError;
  }

  connect() {
    try {
      this.onStatus('Connecting to Relay...');
      this.ws = new WebSocket(this.profile.relayUrl);

      this.ws.onopen = () => {
        this.onStatus('Authenticating Relay...');
        this.ws?.send(JSON.stringify({
          type: 'auth',
          token: this.profile.relayToken
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'auth-success') {
            this.onStatus('Relay Authenticated. Connecting SSH...');
            this.ws?.send(JSON.stringify({
              type: 'connect',
              host: this.profile.host,
              port: this.profile.port,
              username: this.profile.username,
              authMethod: this.profile.authMethod,
              password: this.profile.password,
              privateKey: this.profile.privateKey,
              passphrase: this.profile.passphrase
            }));
          } else if (msg.type === 'connected') {
            this.onStatus('Connected');
          } else if (msg.type === 'data') {
            // Decode base64 from server
            const text = atob(msg.data);
            this.onData(text);
          } else if (msg.type === 'error') {
            this.onError(msg.message);
          } else if (msg.type === 'disconnected') {
            this.onStatus('Disconnected');
            this.ws?.close();
          }
        } catch (e) {
          console.error('Parse error', e);
        }
      };

      this.ws.onerror = (e) => {
        this.onError('WebSocket Error. Check Relay URL.');
      };

      this.ws.onclose = () => {
        this.onStatus('Disconnected');
      };

    } catch (e) {
      this.onError('Connection failed: ' + String(e));
    }
  }

  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'data',
        data: data
      }));
    }
  }

  resize(cols: number, rows: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'resize',
        cols,
        rows,
        width: 0,
        height: 0
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
