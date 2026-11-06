import { MockStorageArea, type StorageChangeCallback } from './mock-storage.js';
import type { BackendProxy } from './backend-proxy.js';

export interface MockTab {
  id: number;
  url: string;
  title: string;
  active: boolean;
}

export interface MessageListenerContext {
  message: unknown;
  sender: {
    id?: string;
    tab?: { id: number; url: string; title: string };
  };
  sendResponse: (response?: unknown) => void;
}

export type MessageListener = (
  message: unknown,
  sender: { id?: string; tab?: { id: number; url: string; title: string } },
  sendResponse: (response?: unknown) => void
) => boolean | void | Promise<unknown>;

export interface MockChromeRuntime {
  storage: {
    local: MockStorageArea;
    session: MockStorageArea;
    sync: MockStorageArea;
    onChanged: {
      addListener: (callback: StorageChangeCallback) => void;
      removeListener: (callback: StorageChangeCallback) => void;
    };
  };
  runtime: {
    id: string;
    lastError: { message: string } | null;
    getManifest: () => Record<string, unknown>;
    getURL: (path: string) => string;
    sendMessage: (message: unknown) => Promise<unknown>;
    onMessage: {
      addListener: (listener: MessageListener) => void;
      removeListener: (listener: MessageListener) => void;
    };
  };
  tabs: {
    query: (queryInfo: Record<string, unknown>) => Promise<MockTab[]>;
    sendMessage: (tabId: number, message: unknown) => Promise<unknown>;
  };
  action: {
    setBadgeText: (details: { text: string }) => Promise<void>;
    setBadgeBackgroundColor: (details: { color: string }) => Promise<void>;
    setTitle: (details: { title: string }) => Promise<void>;
  };
  log: Array<{ type: 'message' | 'storage'; timestamp: number; payload: unknown }>;
}

export interface CreateMockChromeOptions {
  manifest?: Record<string, unknown> | undefined;
  extensionId?: string | undefined;
  mockTabs?: MockTab[] | undefined;
  backendProxy?: BackendProxy | undefined;
  initialStorage?: {
    local?: Record<string, unknown> | undefined;
    session?: Record<string, unknown> | undefined;
    sync?: Record<string, unknown> | undefined;
  } | undefined;
}

export function createMockChromeRuntime(options: CreateMockChromeOptions = {}): MockChromeRuntime {
  const localStorage = new MockStorageArea('local', options.initialStorage?.local);
  const sessionStorage = new MockStorageArea('session', options.initialStorage?.session);
  const syncStorage = new MockStorageArea('sync', options.initialStorage?.sync);

  const storageListeners = new Set<StorageChangeCallback>();
  const messageListeners = new Set<MessageListener>();
  const activityLog: Array<{ type: 'message' | 'storage'; timestamp: number; payload: unknown }> = [];

  const forwardStorageChange: StorageChangeCallback = (changes, areaName) => {
    activityLog.push({ type: 'storage', timestamp: Date.now(), payload: { areaName, changes } });
    for (const listener of storageListeners) {
      try {
        listener(changes, areaName);
      } catch (err) {
        console.error('[MockChrome] Storage listener error:', err);
      }
    }
  };

  localStorage.addListener(forwardStorageChange);
  sessionStorage.addListener(forwardStorageChange);
  syncStorage.addListener(forwardStorageChange);

  const extensionId = options.extensionId ?? 'mock-addon-dev-id';
  const manifestData = options.manifest ?? {
    name: 'Browser Extension Stand',
    version: '1.0.0',
    manifest_version: 3,
  };

  const defaultTabs: MockTab[] = options.mockTabs ?? [
    { id: 1, url: 'about:blank', title: 'Active Tab', active: true },
  ];

  const mockRuntime: MockChromeRuntime = {
    storage: {
      local: localStorage,
      session: sessionStorage,
      sync: syncStorage,
      onChanged: {
        addListener: (cb) => storageListeners.add(cb),
        removeListener: (cb) => storageListeners.delete(cb),
      },
    },
    runtime: {
      id: extensionId,
      lastError: null,
      getManifest: () => ({ ...manifestData }),
      getURL: (path: string) => `chrome-extension://${extensionId}/${path.replace(/^\//, '')}`,
      sendMessage: async (message: unknown) => {
        activityLog.push({ type: 'message', timestamp: Date.now(), payload: message });

        if (options.backendProxy && typeof message === 'object' && message !== null && 'action' in message) {
          const actionName = String((message as { action: unknown }).action);
          const intercepted = await options.backendProxy.interceptMessage(actionName, message);
          if (intercepted.handled) {
            return intercepted.result;
          }
        }

        const sender = { id: extensionId };
        for (const listener of messageListeners) {
          try {
            const result = listener(message, sender, () => {});
            if (result !== undefined) return result;
          } catch (err) {
            console.error('[MockChrome] Message listener error:', err);
          }
        }
        return { ok: true };
      },
      onMessage: {
        addListener: (listener) => messageListeners.add(listener),
        removeListener: (listener) => messageListeners.delete(listener),
      },
    },
    tabs: {
      query: async () => [...defaultTabs],
      sendMessage: async (_tabId, message) => {
        activityLog.push({ type: 'message', timestamp: Date.now(), payload: message });
        return { ok: true };
      },
    },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {},
      setTitle: async () => {},
    },
    log: activityLog,
  };

  return mockRuntime;
}

export function injectMockChromeGlobal(runtime: MockChromeRuntime): void {
  if (typeof window === 'undefined') return;

  const currentWindow = window as unknown as Record<string, unknown>;
  if (!currentWindow['chrome']) {
    currentWindow['chrome'] = runtime;
  }
  if (!currentWindow['browser']) {
    currentWindow['browser'] = runtime;
  }
}
