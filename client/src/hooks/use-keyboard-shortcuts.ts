import { useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcuts } from '@/lib/config';

interface ShortcutHandlers {
  onNewSession?: () => void;
  onCloseSession?: () => void;
  onNextSession?: () => void;
  onPrevSession?: () => void;
  onToggleVoice?: () => void;
  onUploadImage?: () => void;
  onTakeScreenshot?: () => void;
  onToggleConnectionManager?: () => void;
  onRunClaude?: () => void;
  onRunClaudeYolo?: () => void;
  onGitCommit?: () => void;
  onGitPush?: () => void;
}

function parseShortcut(shortcut: string): { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } {
  const parts = shortcut.toLowerCase().split('+');
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  const eventKey = event.key.toLowerCase();

  // Handle special keys
  let keyMatch = eventKey === parsed.key;
  if (parsed.key === 'tab') keyMatch = eventKey === 'tab';

  return (
    keyMatch &&
    event.ctrlKey === parsed.ctrl &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.metaKey === parsed.meta
  );
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  handlers: ShortcutHandlers,
  enabled: boolean = true
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields (unless they're modifiers)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow shortcuts with Ctrl or Meta
        if (!event.ctrlKey && !event.metaKey) return;
      }

      const h = handlersRef.current;

      if (matchesShortcut(event, shortcuts.newSession) && h.onNewSession) {
        event.preventDefault();
        h.onNewSession();
      } else if (matchesShortcut(event, shortcuts.closeSession) && h.onCloseSession) {
        event.preventDefault();
        h.onCloseSession();
      } else if (matchesShortcut(event, shortcuts.nextSession) && h.onNextSession) {
        event.preventDefault();
        h.onNextSession();
      } else if (matchesShortcut(event, shortcuts.prevSession) && h.onPrevSession) {
        event.preventDefault();
        h.onPrevSession();
      } else if (matchesShortcut(event, shortcuts.toggleVoice) && h.onToggleVoice) {
        event.preventDefault();
        h.onToggleVoice();
      } else if (matchesShortcut(event, shortcuts.uploadImage) && h.onUploadImage) {
        event.preventDefault();
        h.onUploadImage();
      } else if (matchesShortcut(event, shortcuts.takeScreenshot) && h.onTakeScreenshot) {
        event.preventDefault();
        h.onTakeScreenshot();
      } else if (matchesShortcut(event, shortcuts.toggleConnectionManager) && h.onToggleConnectionManager) {
        event.preventDefault();
        h.onToggleConnectionManager();
      } else if (matchesShortcut(event, shortcuts.runClaude) && h.onRunClaude) {
        event.preventDefault();
        h.onRunClaude();
      } else if (matchesShortcut(event, shortcuts.runClaudeYolo) && h.onRunClaudeYolo) {
        event.preventDefault();
        h.onRunClaudeYolo();
      } else if (matchesShortcut(event, shortcuts.gitCommit) && h.onGitCommit) {
        event.preventDefault();
        h.onGitCommit();
      } else if (matchesShortcut(event, shortcuts.gitPush) && h.onGitPush) {
        event.preventDefault();
        h.onGitPush();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
