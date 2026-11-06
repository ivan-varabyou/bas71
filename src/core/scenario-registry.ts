import type { StandScenario } from './types.js';
import type { MockChromeRuntime } from '../runtime/mock-chrome.js';
import type { BackendProxy } from '../runtime/backend-proxy.js';

export interface ScenarioActivationContext<TState extends Record<string, unknown>> {
  runtime: MockChromeRuntime;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  backendProxy: BackendProxy;
}

export class ScenarioRegistry<TState extends Record<string, unknown> = Record<string, unknown>> {
  private readonly scenarios = new Map<string, StandScenario<TState>>();
  private activeId: string | null = null;
  private readonly initialStorage: {
    local?: Record<string, unknown> | undefined;
    session?: Record<string, unknown> | undefined;
    sync?: Record<string, unknown> | undefined;
  } | undefined;

  constructor(
    scenarios: Array<StandScenario<TState>> = [],
    initialStorage?: {
      local?: Record<string, unknown> | undefined;
      session?: Record<string, unknown> | undefined;
      sync?: Record<string, unknown> | undefined;
    },
    defaultScenarioId?: string
  ) {
    this.initialStorage = initialStorage;
    for (const sc of scenarios) {
      this.scenarios.set(sc.id, sc);
    }
    this.activeId = defaultScenarioId ?? scenarios[0]?.id ?? null;
  }

  getAll(): Array<StandScenario<TState>> {
    return Array.from(this.scenarios.values());
  }

  getActive(): StandScenario<TState> | null {
    if (!this.activeId) return null;
    return this.scenarios.get(this.activeId) ?? null;
  }

  async activate(scenarioId: string, context: ScenarioActivationContext<TState>): Promise<boolean> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      console.warn(`[bas71:ScenarioRegistry] scenario "${scenarioId}" not found`);
      return false;
    }

    this.activeId = scenarioId;

    // 1. Reset storage to base
    await context.runtime.storage.local.clear();
    await context.runtime.storage.session.clear();
    await context.runtime.storage.sync.clear();

    if (this.initialStorage?.local) {
      await context.runtime.storage.local.set(this.initialStorage.local);
    }
    if (this.initialStorage?.session) {
      await context.runtime.storage.session.set(this.initialStorage.session);
    }
    if (this.initialStorage?.sync) {
      await context.runtime.storage.sync.set(this.initialStorage.sync);
    }

    // 2. Apply scenario storage overrides
    if (scenario.storage?.local) {
      await context.runtime.storage.local.set(scenario.storage.local);
    }
    if (scenario.storage?.session) {
      await context.runtime.storage.session.set(scenario.storage.session);
    }
    if (scenario.storage?.sync) {
      await context.runtime.storage.sync.set(scenario.storage.sync);
    }

    // 3. Apply scenario state override
    if (scenario.state) {
      context.setState(scenario.state);
    }

    // 4. Update BackendProxy with scenario handlers
    context.backendProxy.setScenarioHandlers(scenario.handlers ?? []);

    return true;
  }
}
