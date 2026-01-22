import { useState, useRef, useEffect, useCallback } from "react";
import TerminalComponent from "@/components/Terminal";
import ConnectionManager from "@/components/ConnectionManager";
import { QuickActions } from "@/components/QuickActions";
import { SSHProfile } from "@/lib/storage";
import { SSHClient } from "@/lib/ssh-client";
import { MockRelay } from "@/lib/mock-relay";
import { ConfigManager, TerminalConfig, DEFAULT_CONFIG } from "@/lib/config";
import { SessionStorage, PersistedSession } from "@/lib/session-storage";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import {
  Terminal as TerminalIcon,
  Settings,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  name: string;
  profileId: string;
  profile: SSHProfile;
  client: SSHClient | null;
  mockRelay: MockRelay | null;
  isDemo: boolean;
  active: boolean;
  status: string;
}

type ViewMode = 'single' | 'grid' | 'overview';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showConnectionManager, setShowConnectionManager] = useState(true);
  const [config, setConfig] = useState<TerminalConfig>(DEFAULT_CONFIG);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const { toast } = useToast();

  // Ref to hold terminal instances
  const termRefs = useRef<Record<string, { write: (d: string) => void; fit: () => void }>>({});

  // Hidden file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load config on mount
  useEffect(() => {
    ConfigManager.load().then(setConfig);
  }, []);

  // Load persisted sessions on mount
  useEffect(() => {
    if (config.persistSessions) {
      SessionStorage.getSessions().then(async (persistedSessions) => {
        if (persistedSessions.length > 0) {
          // Restore sessions (but don't auto-connect, just show them)
          const activeId = await SessionStorage.getActiveSessionId();
          if (activeId) {
            setActiveSessionId(activeId);
          }
        }
      });
    }
  }, [config.persistSessions]);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Voice input
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (activeSessionId) {
        const session = sessions.find((s) => s.id === activeSessionId);
        if (session?.isDemo && session?.mockRelay) {
          session.mockRelay.send(text);
        } else if (session?.client) {
          session.client.send(text);
        }
      }
    },
    [activeSessionId, sessions]
  );

  const { isListening, isSupported: isVoiceSupported, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    onError: (error) => toast({ title: "Voice Error", description: error, variant: "destructive" }),
  });

  // File upload handlers
  const handleUploadComplete = useCallback(
    (result: { success: boolean; path?: string; error?: string }) => {
      if (result.success && result.path) {
        toast({ title: "Upload Complete", description: `File saved to ${result.path}` });
        // Send path to terminal
        if (activeSessionId) {
          handleTerminalData(activeSessionId, result.path);
        }
      } else {
        toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
      }
    },
    [activeSessionId, toast]
  );

  const {
    isUploading,
    handleImageSelect,
    handleFileSelect,
    triggerImageUpload,
    triggerFileUpload,
    takeScreenshot,
  } = useFileUpload({
    onUploadComplete: handleUploadComplete,
    onError: (error) => toast({ title: "Upload Error", description: error, variant: "destructive" }),
    relayUrl: activeSession?.profile?.relayUrl || "",
    sessionId: activeSessionId || "",
  });

  const handleConnect = useCallback(
    (profile: SSHProfile) => {
      const sessionId = Math.random().toString(36).substring(7);
      const isDemo = profile.isDemo === true;

      const newSession: Session = {
        id: sessionId,
        name: isDemo ? "Demo" : profile.name,
        profileId: profile.id,
        profile,
        client: null,
        mockRelay: null,
        isDemo,
        active: true,
        status: "Initializing...",
      };

      setSessions((prev) => {
        const others = prev.map((s) => ({ ...s, active: false }));
        return [...others, newSession];
      });
      setActiveSessionId(sessionId);
      setShowConnectionManager(false);

      // Persist session
      if (config.persistSessions) {
        SessionStorage.addSession({
          id: sessionId,
          profileId: profile.id,
          profile,
          name: newSession.name,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isDemo,
        });
        SessionStorage.setActiveSessionId(sessionId);
      }

      const callbacks = {
        onData: (data: string) => {
          if (termRefs.current[sessionId]) {
            termRefs.current[sessionId].write(data);
          }
        },
        onStatus: (status: string) => {
          setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)));
        },
        onError: (error: string) => {
          toast({ title: "Connection Error", description: error, variant: "destructive" });
          setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: "Error" } : s)));
        },
      };

      if (isDemo) {
        const mockRelay = new MockRelay(callbacks);
        mockRelay.connect();
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, mockRelay } : s)));
      } else {
        const client = new SSHClient(profile, callbacks);
        client.connect();
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, client } : s)));
      }
    },
    [config.persistSessions, toast]
  );

  const closeSession = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const session = sessions.find((s) => s.id === id);
      if (session?.client) session.client.disconnect();
      if (session?.mockRelay) session.mockRelay.disconnect();

      const newSessions = sessions.filter((s) => s.id !== id);
      setSessions(newSessions);

      // Remove from persistence
      if (config.persistSessions) {
        SessionStorage.removeSession(id);
      }

      if (activeSessionId === id) {
        if (newSessions.length > 0) {
          const newActiveId = newSessions[newSessions.length - 1].id;
          setActiveSessionId(newActiveId);
          setSessions((prev) => prev.map((s) => ({ ...s, active: s.id === newActiveId })));
          if (config.persistSessions) {
            SessionStorage.setActiveSessionId(newActiveId);
          }
        } else {
          setActiveSessionId(null);
          setShowConnectionManager(true);
          if (config.persistSessions) {
            SessionStorage.setActiveSessionId(null);
          }
        }
      }
    },
    [activeSessionId, sessions, config.persistSessions]
  );

  const switchSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      setSessions((prev) => prev.map((s) => ({ ...s, active: s.id === id })));
      if (config.persistSessions) {
        SessionStorage.setActiveSessionId(id);
        SessionStorage.updateSession(id, { lastActiveAt: Date.now() });
      }
      setTimeout(() => {
        termRefs.current[id]?.fit();
      }, 100);
    },
    [config.persistSessions]
  );

  const nextSession = useCallback(() => {
    if (sessions.length < 2) return;
    const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
    const nextIndex = (currentIndex + 1) % sessions.length;
    switchSession(sessions[nextIndex].id);
  }, [sessions, activeSessionId, switchSession]);

  const prevSession = useCallback(() => {
    if (sessions.length < 2) return;
    const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
    const prevIndex = (currentIndex - 1 + sessions.length) % sessions.length;
    switchSession(sessions[prevIndex].id);
  }, [sessions, activeSessionId, switchSession]);

  const handleTerminalData = useCallback(
    (id: string, data: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session?.isDemo && session?.mockRelay) {
        session.mockRelay.send(data);
      } else if (session?.client) {
        session.client.send(data);
      }
    },
    [sessions]
  );

  const handleTerminalResize = useCallback(
    (id: string, cols: number, rows: number) => {
      const session = sessions.find((s) => s.id === id);
      if (session?.isDemo && session?.mockRelay) {
        session.mockRelay.resize(cols, rows);
      } else if (session?.client) {
        session.client.resize(cols, rows);
      }
    },
    [sessions]
  );

  const sendCommand = useCallback(
    (cmd: string) => {
      if (activeSessionId) {
        handleTerminalData(activeSessionId, cmd);
      }
    },
    [activeSessionId, handleTerminalData]
  );

  // Quick action commands
  const runClaude = useCallback(() => {
    const cmd = config.claudeStartDir ? `cd ${config.claudeStartDir} && claude\r` : "claude\r";
    sendCommand(cmd);
  }, [config.claudeStartDir, sendCommand]);

  const runClaudeYolo = useCallback(() => {
    const cmd = config.claudeStartDir
      ? `cd ${config.claudeStartDir} && claude --dangerously-skip-permissions\r`
      : "claude --dangerously-skip-permissions\r";
    sendCommand(cmd);
  }, [config.claudeStartDir, sendCommand]);

  const gitCommit = useCallback(() => {
    sendCommand('git add -A && git commit -m "WIP"\r');
  }, [sendCommand]);

  const gitPush = useCallback(() => {
    sendCommand("git push\r");
  }, [sendCommand]);

  // Keyboard shortcuts
  useKeyboardShortcuts(config.shortcuts, {
    onNewSession: () => setShowConnectionManager(true),
    onCloseSession: () => activeSessionId && closeSession(activeSessionId),
    onNextSession: nextSession,
    onPrevSession: prevSession,
    onToggleVoice: toggleListening,
    onUploadImage: triggerImageUpload,
    onTakeScreenshot: takeScreenshot,
    onToggleConnectionManager: () => setShowConnectionManager((prev) => !prev),
    onRunClaude: runClaude,
    onRunClaudeYolo: runClaudeYolo,
    onGitCommit: gitCommit,
    onGitPush: gitPush,
  });

  // Cycle view mode
  const cycleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === "single") return "grid";
      if (prev === "grid") return "overview";
      return "single";
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

      {/* Top Bar */}
      <div className="flex items-center h-10 border-b border-border px-2 gap-2 bg-card/50 backdrop-blur-sm shrink-0">
        {/* Session Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[40%]">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => switchSession(s.id)}
              className={`
                flex items-center gap-2 px-3 py-1 text-xs rounded-sm cursor-pointer select-none border transition-colors
                ${
                  s.active
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted/20 border-transparent hover:bg-muted/30 text-muted-foreground"
                }
              `}
            >
              {s.status === "Connected" ? (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              )}
              <span className="truncate max-w-[80px]">{s.name}</span>
              <X
                className="h-3 w-3 hover:text-destructive"
                onClick={(e) => closeSession(s.id, e)}
              />
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowConnectionManager(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        {config.showQuickActions && (
          <QuickActions
            onSendCommand={sendCommand}
            onUploadImage={triggerImageUpload}
            onTakeScreenshot={takeScreenshot}
            onUploadFile={triggerFileUpload}
            isListening={isListening}
            onToggleVoice={toggleListening}
            isVoiceSupported={isVoiceSupported}
            snippets={config.snippets}
            claudeStartDir={config.claudeStartDir}
            disabled={!activeSessionId}
          />
        )}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* View mode toggle */}
          {sessions.length > 1 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cycleViewMode}>
              {viewMode === "single" && <Maximize2 className="h-4 w-4" />}
              {viewMode === "grid" && <Grid3X3 className="h-4 w-4" />}
              {viewMode === "overview" && <LayoutGrid className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowConnectionManager(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {showConnectionManager && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-border/30">
                <div className="flex items-center gap-2 text-primary font-mono text-lg font-bold">
                  <TerminalIcon className="h-5 w-5" />
                  Nebula Terminal
                </div>
                {sessions.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowConnectionManager(false)}>
                    Close
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ConnectionManager onConnect={handleConnect} />
              </div>
            </div>
          </div>
        )}

        {/* Terminal Views */}
        {viewMode === "single" && (
          <>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="h-full w-full"
                style={{ display: s.active ? "block" : "none" }}
              >
                <TerminalComponent
                  active={s.active}
                  onData={(d) => handleTerminalData(s.id, d)}
                  onResize={(c, r) => handleTerminalResize(s.id, c, r)}
                  registerRef={(api) => {
                    termRefs.current[s.id] = api;
                  }}
                />
              </div>
            ))}
          </>
        )}

        {viewMode === "grid" && sessions.length > 0 && (
          <div
            className="h-full w-full grid gap-1 p-1"
            style={{
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(sessions.length))}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(sessions.length / Math.ceil(Math.sqrt(sessions.length)))}, 1fr)`,
            }}
          >
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`border rounded overflow-hidden ${s.active ? "border-primary" : "border-border"}`}
                onClick={() => switchSession(s.id)}
              >
                <div className="h-6 bg-muted/50 flex items-center px-2 text-xs">
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="h-[calc(100%-1.5rem)]">
                  <TerminalComponent
                    active={true}
                    onData={(d) => handleTerminalData(s.id, d)}
                    onResize={(c, r) => handleTerminalResize(s.id, c, r)}
                    registerRef={(api) => {
                      termRefs.current[s.id] = api;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "overview" && sessions.length > 0 && (
          <div className="h-full w-full p-4 overflow-auto">
            <h2 className="text-lg font-bold mb-4">Active Sessions ({sessions.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors ${s.active ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  onClick={() => {
                    switchSession(s.id);
                    setViewMode("single");
                  }}
                >
                  <div className="h-8 bg-muted/50 flex items-center justify-between px-3 text-sm">
                    <span className="truncate font-medium">{s.name}</span>
                    <span
                      className={`text-xs ${s.status === "Connected" ? "text-green-500" : "text-yellow-500"}`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="h-32 bg-background/50 p-2 text-xs text-muted-foreground">
                    <p>Profile: {s.profile.name}</p>
                    <p>
                      Host: {s.profile.host}:{s.profile.port}
                    </p>
                    <p>User: {s.profile.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && !showConnectionManager && (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
            <div className="p-4 rounded-full bg-muted/20">
              <TerminalIcon className="h-8 w-8 opacity-50" />
            </div>
            <p>No active sessions</p>
            <Button onClick={() => setShowConnectionManager(true)}>Open Connection Manager</Button>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}

export default App;
