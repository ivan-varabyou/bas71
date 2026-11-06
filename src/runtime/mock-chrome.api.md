# MockChromeRuntime Entity Contract

Fidelity polyfill of the Chrome Extension Runtime APIs for browser dev tabs.

## Public Interface

```typescript
export interface CreateMockChromeOptions {
  manifest?: Record<string, unknown>;
  extensionId?: string;
  mockTabs?: MockTab[];
  backendProxy?: BackendProxy;
  initialStorage?: {
    local?: Record<string, unknown>;
    session?: Record<string, unknown>;
    sync?: Record<string, unknown>;
  };
}

export function createMockChromeRuntime(options?: CreateMockChromeOptions): MockChromeRuntime;
export function injectMockChromeGlobal(runtime: MockChromeRuntime): void;
```

## Behavior & Invariants
- Polyfills `chrome.storage` (local, session, sync) with reactive onChanged events.
- Polyfills `chrome.runtime` (id, getURL, getManifest, sendMessage, onMessage).
- Routes `runtime.sendMessage` through `BackendProxy` if an action handler matches.
- Injects `window.chrome` and `window.browser` without overwriting real instances.
