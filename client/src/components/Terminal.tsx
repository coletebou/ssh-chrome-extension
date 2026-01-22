import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  active: boolean;
  registerRef: (api: { write: (data: string) => void, fit: () => void }) => void;
}

export default function Terminal({ onData, onResize, active, registerRef }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      theme: {
        background: '#0d1117', // Match --color-background
        foreground: '#c9d1d9',
        cursor: '#2ea043',     // Match --color-primary
        selectionBackground: 'rgba(46, 160, 67, 0.3)',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(searchAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    term.onData((data) => {
      onData(data);
    });

    term.onResize((size) => {
      onResize(size.cols, size.rows);
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    registerRef({
      write: (d) => term.write(d),
      fit: () => fitAddon.fit(),
    });

    const resizeObserver = new ResizeObserver(() => {
      if (active) {
        // Debounce slightly to prevent flickering during rapid resize
        requestAnimationFrame(() => {
            fitAddon.fit();
            onResize(term.cols, term.rows);
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (active && fitAddonRef.current) {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    }
  }, [active]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full overflow-hidden bg-background"
      style={{ display: active ? 'block' : 'none' }} 
    />
  );
}
