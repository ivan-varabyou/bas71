# Backend & Runtime Interception (agent layer)

Purpose: Network interception, storage emulation, and message routing topology for `bas71`.

**Up:** [root AGENTS.md](../../../AGENTS.md)

## Mock Chrome Extension Runtime & Backend Proxy

`bas71` provides a zero-network-dependency runtime for developing and testing extensions in regular browser tabs:

1. **Storage Emulation (`MockStorageArea`)**:
   - In-memory reactive storage for `local`, `session`, and `sync` areas.
   - Triggers `chrome.storage.onChanged` listeners synchronously upon mutations.
   - Inspectable via the multi-area `StorageInspector` modal.

2. **Network & Backend Interception (`BackendProxy`)**:
   - Intercepts `globalThis.fetch` for requests matching specific URL regex/strings and HTTP methods.
   - Emulates network delays (`delay: number`) to test loading spinners and race conditions.
   - Emulates error responses and 500 status codes without touching server infrastructure.

3. **Message Routing (`chrome.runtime.sendMessage`)**:
   - Routes action messages matching `RequestHandler.match.action` directly to mock handlers.
   - Falls back to `chrome.runtime.onMessage` listeners when not intercepted.

4. **Scenario Fixtures (`ScenarioRegistry`)**:
   - Declarative scenarios combining storage snapshots, initial state, and active network handlers.
   - Cleanly resets storage and swaps handlers upon switching scenarios.
