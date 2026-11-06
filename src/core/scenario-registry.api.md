# ScenarioRegistry Entity Contract

State and storage fixture orchestration registry for extension dev stands.

## Public Interface

```typescript
export interface ScenarioActivationContext<TState> {
  runtime: MockChromeRuntime;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  backendProxy: BackendProxy;
}

export class ScenarioRegistry<TState extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    scenarios?: Array<StandScenario<TState>>,
    initialStorage?: StandOptions['initialStorage'],
    defaultScenarioId?: string
  );
  getAll(): Array<StandScenario<TState>>;
  getActive(): StandScenario<TState> | null;
  activate(scenarioId: string, context: ScenarioActivationContext<TState>): Promise<boolean>;
}
```

## Behavior & Invariants
- Stores and indexes scenarios by unique `id`.
- On `activate()`, resets all storage areas to initial baseline then applies scenario overrides.
- Updates `BackendProxy` active handlers seamlessly without standalone server reloads.
