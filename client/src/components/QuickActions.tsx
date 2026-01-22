import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Rocket,
  GitBranch,
  GitCommit,
  Upload as UploadIcon,
  Mic,
  MicOff,
  Camera,
  Terminal as TerminalIcon,
  Play,
  FolderGit,
  Activity,
  ChevronDown,
  FileUp,
  Image as ImageIcon,
  Keyboard,
  Settings2,
} from "lucide-react";
import { CommandSnippet } from "@/lib/config";

interface QuickActionsProps {
  onSendCommand: (command: string) => void;
  onUploadImage: () => void;
  onTakeScreenshot: () => void;
  onUploadFile: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
  isVoiceSupported: boolean;
  snippets: CommandSnippet[];
  claudeStartDir: string;
  disabled?: boolean;
}

export function QuickActions({
  onSendCommand,
  onUploadImage,
  onTakeScreenshot,
  onUploadFile,
  isListening,
  onToggleVoice,
  isVoiceSupported,
  snippets,
  claudeStartDir,
  disabled = false,
}: QuickActionsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const runClaude = () => {
    const cmd = claudeStartDir
      ? `cd ${claudeStartDir} && claude`
      : 'claude';
    onSendCommand(cmd + '\r');
  };

  const runClaudeYolo = () => {
    const cmd = claudeStartDir
      ? `cd ${claudeStartDir} && claude --dangerously-skip-permissions`
      : 'claude --dangerously-skip-permissions';
    onSendCommand(cmd + '\r');
  };

  const runClaudeResume = () => {
    const cmd = claudeStartDir
      ? `cd ${claudeStartDir} && claude --resume`
      : 'claude --resume';
    onSendCommand(cmd + '\r');
  };

  const claudeSnippets = snippets.filter(s => s.category === 'claude');
  const gitSnippets = snippets.filter(s => s.category === 'git');
  const tmuxSnippets = snippets.filter(s => s.category === 'tmux');
  const systemSnippets = snippets.filter(s => s.category === 'system');
  const customSnippets = snippets.filter(s => s.category === 'custom');

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-2">
        {/* Claude Actions */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  disabled={disabled}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Claude
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Claude Code commands (Ctrl+Shift+A)</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Claude Code</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={runClaude}>
              <Bot className="mr-2 h-4 w-4" />
              Start Claude
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+A</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={runClaudeYolo}>
              <Rocket className="mr-2 h-4 w-4 text-orange-500" />
              Claude YOLO Mode
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+Y</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={runClaudeResume}>
              <Play className="mr-2 h-4 w-4 text-green-500" />
              Resume Session
            </DropdownMenuItem>
            {claudeSnippets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {claudeSnippets.map(snippet => (
                  <DropdownMenuItem
                    key={snippet.id}
                    onClick={() => onSendCommand(snippet.command + '\r')}
                  >
                    {snippet.icon && <span className="mr-2">{snippet.icon}</span>}
                    {snippet.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Git Actions */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  disabled={disabled}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Git
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Git commands</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Git Commands</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendCommand('git status\r')}>
              <GitBranch className="mr-2 h-4 w-4" />
              Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('git add -A && git commit -m "WIP"\r')}>
              <GitCommit className="mr-2 h-4 w-4" />
              Quick Commit
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+G</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('git push\r')}>
              <UploadIcon className="mr-2 h-4 w-4" />
              Push
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+P</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('git pull\r')}>
              <FolderGit className="mr-2 h-4 w-4" />
              Pull
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderGit className="mr-2 h-4 w-4" />
                Worktrees
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onSendCommand('git worktree list\r')}>
                  List Worktrees
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendCommand('git worktree add ')}>
                  Add Worktree...
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {gitSnippets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {gitSnippets.map(snippet => (
                  <DropdownMenuItem
                    key={snippet.id}
                    onClick={() => onSendCommand(snippet.command + '\r')}
                  >
                    {snippet.icon && <span className="mr-2">{snippet.icon}</span>}
                    {snippet.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* tmux Actions */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  disabled={disabled}
                >
                  <TerminalIcon className="h-3.5 w-3.5" />
                  tmux
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>tmux commands</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>tmux</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendCommand('tmux new -s main\r')}>
              <Play className="mr-2 h-4 w-4" />
              New Session
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('tmux a -t main\r')}>
              <TerminalIcon className="mr-2 h-4 w-4" />
              Attach to main
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('tmux ls\r')}>
              List Sessions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendCommand('tmux kill-session -t ')}>
              Kill Session...
            </DropdownMenuItem>
            {tmuxSnippets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {tmuxSnippets.map(snippet => (
                  <DropdownMenuItem
                    key={snippet.id}
                    onClick={() => onSendCommand(snippet.command + '\r')}
                  >
                    {snippet.icon && <span className="mr-2">{snippet.icon}</span>}
                    {snippet.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* System Actions */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  disabled={disabled}
                >
                  <Activity className="h-3.5 w-3.5" />
                  System
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>System monitoring</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>System</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendCommand('htop\r')}>
              <Activity className="mr-2 h-4 w-4" />
              htop
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('df -h\r')}>
              Disk Usage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('free -h\r')}>
              Memory Usage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendCommand('uptime\r')}>
              Uptime
            </DropdownMenuItem>
            {systemSnippets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {systemSnippets.map(snippet => (
                  <DropdownMenuItem
                    key={snippet.id}
                    onClick={() => onSendCommand(snippet.command + '\r')}
                  >
                    {snippet.icon && <span className="mr-2">{snippet.icon}</span>}
                    {snippet.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Voice Input */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? "default" : "ghost"}
              size="icon"
              className={`h-7 w-7 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
              onClick={onToggleVoice}
              disabled={disabled || !isVoiceSupported}
            >
              {isListening ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isListening ? 'Stop Voice Input' : 'Start Voice Input'} (Ctrl+Shift+V)
          </TooltipContent>
        </Tooltip>

        {/* Upload Actions */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={disabled}
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Upload files</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Upload</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onUploadImage}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Image
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+U</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTakeScreenshot}>
              <Camera className="mr-2 h-4 w-4" />
              Take Screenshot
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUploadFile}>
              <FileUp className="mr-2 h-4 w-4" />
              Upload File (SCP)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Keyboard Shortcuts */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowShortcuts(!showShortcuts)}
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Keyboard Shortcuts
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border rounded-lg p-4 max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>New Session</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+T</kbd></div>
              <div className="flex justify-between"><span>Close Session</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+W</kbd></div>
              <div className="flex justify-between"><span>Next Session</span><kbd className="bg-muted px-1 rounded">Ctrl+Tab</kbd></div>
              <div className="flex justify-between"><span>Previous Session</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+Tab</kbd></div>
              <div className="flex justify-between"><span>Toggle Voice</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+V</kbd></div>
              <div className="flex justify-between"><span>Upload Image</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+U</kbd></div>
              <div className="flex justify-between"><span>Screenshot</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+S</kbd></div>
              <div className="flex justify-between"><span>Run Claude</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+A</kbd></div>
              <div className="flex justify-between"><span>Claude YOLO</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+Y</kbd></div>
              <div className="flex justify-between"><span>Git Commit</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+G</kbd></div>
              <div className="flex justify-between"><span>Git Push</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+P</kbd></div>
              <div className="flex justify-between"><span>Connection Manager</span><kbd className="bg-muted px-1 rounded">Ctrl+Shift+C</kbd></div>
            </div>
            <Button className="w-full mt-4" onClick={() => setShowShortcuts(false)}>Close</Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
