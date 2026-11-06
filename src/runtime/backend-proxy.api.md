# BackendProxy Entity Contract

Universal network and message interception engine for dev stands.

## Public Interface

```typescript
export interface RequestMatch {
  url?: string | RegExp;
  method?: string;
  action?: string;
}

export interface RequestHandler {
  match: RequestMatch;
  respond: (req: InterceptedRequest) => unknown | Promise<unknown>;
  delay?: number;
}

export class BackendProxy {
  install(handlers?: RequestHandler[]): void;
  setScenarioHandlers(handlers?: RequestHandler[]): void;
  addHandler(handler: RequestHandler): void;
  uninstall(): void;
  interceptMessage(action: string, payload: unknown): Promise<{ handled: boolean; result?: unknown }>;
}
```

## Behavior & Invariants
- Seamlessly intercepts `globalThis.fetch` when URL or method matches.
- Scenario handlers override base handlers.
- Supports network latency emulation via `delay`.
- Clean lifecycle restoration on `uninstall()`.
