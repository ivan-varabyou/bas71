# StorageInspector Entity Contract

Multi-area storage inspection and mutation UI modal for `chrome.storage`.

## Public Interface

```typescript
export type StorageAreaKey = 'local' | 'session' | 'sync';

export class StorageInspector {
  constructor(runtime: MockChromeRuntime);
  toggle(): void;
  destroy(): void;
}
```

## Behavior & Invariants
- Provides visual tab switching between `local`, `session`, and `sync` storage areas.
- Allows clearing individual storage areas without clearing unrelated areas.
- Subscribes to `runtime.storage.onChanged` for live auto-updating while open.
- Safe lifecycle destruction on stand teardown.
