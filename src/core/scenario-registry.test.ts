import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScenarioRegistry } from './scenario-registry.js';
import { createMockChromeRuntime } from '../runtime/mock-chrome.js';
import { BackendProxy } from '../runtime/backend-proxy.js';

describe('ScenarioRegistry', () => {
  let runtime: ReturnType<typeof createMockChromeRuntime>;
  let proxy: BackendProxy;
  let setStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    runtime = createMockChromeRuntime({
      initialStorage: { local: { baseKey: 'baseVal' } },
    });
    proxy = new BackendProxy();
    setStateSpy = vi.fn();
  });

  it('Scenario 1: registers and retrieves scenarios correctly', () => {
    const registry = new ScenarioRegistry([
      { id: 'empty', label: 'Empty' },
      { id: 'loaded', label: 'Loaded' },
    ]);

    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getActive()?.id).toBe('empty');
  });

  it('Scenario 2: activates scenario, resets storage and applies overrides', async () => {
    const registry = new ScenarioRegistry(
      [
        {
          id: 'mocked',
          label: 'Mocked',
          storage: { local: { scenarioKey: 'customVal' } },
          state: { isLoaded: true },
        },
      ],
      { local: { baseKey: 'baseVal' } }
    );

    const ok = await registry.activate('mocked', {
      runtime,
      setState: setStateSpy,
      backendProxy: proxy,
    });

    expect(ok).toBe(true);
    expect(await runtime.storage.local.get('scenarioKey')).toEqual({ scenarioKey: 'customVal' });
    expect(await runtime.storage.local.get('baseKey')).toEqual({ baseKey: 'baseVal' });
    expect(setStateSpy).toHaveBeenCalledWith({ isLoaded: true });
  });

  it('Scenario 3: passes scenario handlers to backendProxy upon activation', async () => {
    const setScenarioHandlersSpy = vi.spyOn(proxy, 'setScenarioHandlers');
    const handlers = [{ match: { url: '/test' }, respond: () => ({ ok: true }) }];

    const registry = new ScenarioRegistry([
      { id: 'with-handlers', label: 'With Handlers', handlers },
    ]);

    await registry.activate('with-handlers', {
      runtime,
      setState: setStateSpy,
      backendProxy: proxy,
    });

    expect(setScenarioHandlersSpy).toHaveBeenCalledWith(handlers);
  });

  it('Scenario 4: handles non-existent scenario gracefully', async () => {
    const registry = new ScenarioRegistry([{ id: 'valid', label: 'Valid' }]);

    const ok = await registry.activate('invalid-id', {
      runtime,
      setState: setStateSpy,
      backendProxy: proxy,
    });

    expect(ok).toBe(false);
    expect(registry.getActive()?.id).toBe('valid');
  });
});
