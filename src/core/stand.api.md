# StandCore Entity Contract

Universal development stand harness mounting browser extension UI in isolated sandboxes.

## Public Interface

```typescript
export function createAddonStand<TState>(options: StandOptions<TState>): AddonStandInstance<TState>;

export interface AddonStandInstance<TState> {
  destroy(): void;
  reload(): void;
  setViewport(viewport: string): void;
  setTheme(theme: StandTheme): void;
  setState(updater: Partial<TState> | ((prev: TState) => Partial<TState>)): void;
  getState(): TState;
  getContext(): StandContext<TState>;
  activateScenario(scenarioId: string): void;
  getActiveScenario(): StandScenario<TState> | null;
  getScenarios(): Array<StandScenario<TState>>;
}
```

## Behavior & Invariants
- Enforces strict unmount cleanup before re-mounting upon reload or scenario change.
- Injects non-destructive `chrome` and `browser` global polyfills.
- Orchestrates `BackendProxy`, `ScenarioRegistry`, and `StorageInspector`.
- Completely disposes DOM nodes, observers, and network hooks on `destroy()`.
