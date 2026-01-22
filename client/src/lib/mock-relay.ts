// Simulates an SSH session for demo purposes
export class MockRelay {
  private inputBuffer: string = '';
  private onData: (data: string) => void;
  private onStatus: (status: string) => void;

  constructor(callbacks: {
    onData: (data: string) => void;
    onStatus: (status: string) => void;
  }) {
    this.onData = callbacks.onData;
    this.onStatus = callbacks.onStatus;
  }

  connect() {
    this.onStatus('Connecting...');
    this.write('\x1b[32m✔ Connected to Nebula Relay (DEMO MODE)\x1b[0m\r\n');
    this.write('Authenticating...\r\n');

    setTimeout(() => {
      this.write('\x1b[32m✔ Authentication successful\x1b[0m\r\n');
      this.write('Establishing SSH tunnel to demo host...\r\n');

      setTimeout(() => {
        this.onStatus('Connected');
        this.write('\x1b[2J\x1b[H'); // Clear screen
        this.showMotd();
        this.prompt();
      }, 800);
    }, 500);
  }

  private write(data: string) {
    this.onData(data);
  }

  private showMotd() {
    this.write('Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)\r\n');
    this.write('\r\n');
    this.write(' * Documentation:  https://help.ubuntu.com\r\n');
    this.write(' * Management:     https://landscape.canonical.com\r\n');
    this.write(' * Support:        https://ubuntu.com/advantage\r\n');
    this.write('\r\n');
    this.write('Last login: ' + new Date().toUTCString() + ' from 192.168.1.5\r\n');
    this.write('\r\n');
  }

  private prompt() {
    this.write('\x1b[1;32muser@nebula-demo\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
  }

  send(data: string) {
    // Handle each character
    for (const char of data) {
      this.handleChar(char);
    }
  }

  private handleChar(char: string) {
    if (char === '\r') {
      this.write('\r\n');
      this.processCommand(this.inputBuffer.trim());
      this.inputBuffer = '';
      this.prompt();
    } else if (char === '\u007F') {
      // Backspace
      if (this.inputBuffer.length > 0) {
        this.inputBuffer = this.inputBuffer.slice(0, -1);
        this.write('\b \b');
      }
    } else if (char === '\u0003') {
      // Ctrl+C
      this.write('^C\r\n');
      this.inputBuffer = '';
      this.prompt();
    } else if (char >= ' ' || char === '\t') {
      this.inputBuffer += char;
      this.write(char);
    }
  }

  private processCommand(cmd: string) {
    if (!cmd) return;

    const parts = cmd.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        this.write('Demo mode - available commands:\r\n');
        this.write('  help     - Show this help\r\n');
        this.write('  ls       - List files\r\n');
        this.write('  pwd      - Print working directory\r\n');
        this.write('  whoami   - Print current user\r\n');
        this.write('  date     - Print current date\r\n');
        this.write('  uname    - Print system info\r\n');
        this.write('  echo     - Echo arguments\r\n');
        this.write('  clear    - Clear terminal\r\n');
        this.write('  neofetch - System info (simulated)\r\n');
        break;

      case 'ls':
        this.write('\x1b[1;34mDocuments\x1b[0m  \x1b[1;34mDownloads\x1b[0m  \x1b[1;32mscripts\x1b[0m  .bashrc  .profile  notes.txt\r\n');
        break;

      case 'pwd':
        this.write('/home/user\r\n');
        break;

      case 'whoami':
        this.write('user\r\n');
        break;

      case 'date':
        this.write(new Date().toString() + '\r\n');
        break;

      case 'uname':
        if (args.includes('-a')) {
          this.write('Linux nebula-demo 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux\r\n');
        } else {
          this.write('Linux\r\n');
        }
        break;

      case 'echo':
        this.write(args.join(' ') + '\r\n');
        break;

      case 'clear':
        this.write('\x1b[2J\x1b[H');
        break;

      case 'neofetch':
        this.showNeofetch();
        break;

      case 'exit':
        this.write('logout\r\n');
        this.write('\x1b[33mDemo session ended. Refresh to restart.\x1b[0m\r\n');
        this.onStatus('Disconnected');
        break;

      default:
        this.write(`\x1b[31m${command}: command not found\x1b[0m (try 'help')\r\n`);
    }
  }

  private showNeofetch() {
    const lines = [
      '\x1b[34m            .-/+oossssoo+/-.',
      '\x1b[34m        `:+ssssssssssssssssss+:`',
      '\x1b[34m      -+ssssssssssssssssssyyssss+-',
      '\x1b[34m    .ossssssssssssssssss\x1b[37mdMMMNy\x1b[34msssso.',
      '\x1b[34m   /sssssssssss\x1b[37mhdmmNNmmyNMMMMh\x1b[34mssssss/',
      '\x1b[34m  +sssssssss\x1b[37mhm\x1b[34myd\x1b[37mMMMMMMMNddddy\x1b[34mssssssss+',
      '\x1b[34m /ssssssss\x1b[37mhNMMM\x1b[34myh\x1b[37mhyyyyhmNMMMNh\x1b[34mssssssss/',
      '\x1b[34m.ssssssss\x1b[37mdMMMNh\x1b[34mssssssssss\x1b[37mhNMMMd\x1b[34mssssssss.',
      '\x1b[34m+ssss\x1b[37mhhhyNMMNy\x1b[34mssssssssssss\x1b[37myNMMMy\x1b[34msssssss+',
      '\x1b[34moss\x1b[37myNMMMNyMMh\x1b[34mssssssssssssss\x1b[37mhmmmh\x1b[34mssssssso',
      '\x1b[34moss\x1b[37myNMMMNyMMh\x1b[34msssssssssssssssmMMMh\x1b[34mssssssso   \x1b[32muser\x1b[0m@\x1b[32mnebula-demo',
      '\x1b[34m+ssss\x1b[37mhhhyNMMNy\x1b[34mssssssssssss\x1b[37myNMMMy\x1b[34msssssss+   \x1b[0m--------------',
      '\x1b[34m.ssssssss\x1b[37mdMMMNh\x1b[34mssssssssss\x1b[37mhNMMMd\x1b[34mssssssss.   \x1b[32mOS:\x1b[0m Ubuntu 22.04.3 LTS',
      '\x1b[34m /ssssssss\x1b[37mhNMMM\x1b[34myh\x1b[37mhyyyyhdNMMMNh\x1b[34mssssssss/   \x1b[32mHost:\x1b[0m Nebula Cloud VM',
      '\x1b[34m  +sssssssss\x1b[37mdm\x1b[34myd\x1b[37mMMMMMMMMddddy\x1b[34mssssssss+    \x1b[32mKernel:\x1b[0m 5.15.0-91-generic',
      '\x1b[34m   /sssssssssss\x1b[37mhdmNNNNmyNMMMMh\x1b[34mssssss/     \x1b[32mUptime:\x1b[0m 42 days, 3 hours',
      '\x1b[34m    .ossssssssssssssssss\x1b[37mdMMMNy\x1b[34msssso.      \x1b[32mShell:\x1b[0m bash 5.1.16',
      '\x1b[34m      -+sssssssssssssssss\x1b[37myyyy\x1b[34mssss+-        \x1b[32mTerminal:\x1b[0m Nebula Terminal',
      '\x1b[34m        `:+ssssssssssssssssss+:`          \x1b[32mCPU:\x1b[0m Intel Xeon (4) @ 2.8GHz',
      '\x1b[34m            .-/+oossssoo+/-.              \x1b[32mMemory:\x1b[0m 1024MiB / 8192MiB',
    ];
    lines.forEach(line => this.write(line + '\r\n'));
    this.write('\r\n');
  }

  resize(_cols: number, _rows: number) {
    // No-op for demo
  }

  disconnect() {
    // No-op for demo
  }
}
