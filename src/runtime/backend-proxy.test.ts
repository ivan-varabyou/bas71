// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackendProxy } from './backend-proxy.js';

describe('BackendProxy', () => {
  let proxy: BackendProxy;

  beforeEach(() => {
    proxy = new BackendProxy();
  });

  afterEach(() => {
    proxy.uninstall();
  });

  it('Scenario 1: intercepts fetch matching URL and returns mock Response', async () => {
    proxy.install([
      {
        match: { url: '/api/v1/user' },
        respond: () => ({ id: 42, name: 'Alice' }),
      },
    ]);

    const res = await fetch('http://test.local/api/v1/user');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ id: 42, name: 'Alice' });
  });

  it('Scenario 2: delays response when delay is configured', async () => {
    proxy.install([
      {
        match: { url: '/api/slow' },
        respond: () => ({ delayed: true }),
        delay: 50,
      },
    ]);

    const start = Date.now();
    await fetch('http://test.local/api/slow');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('Scenario 3: simulates error rejection when respond throws', async () => {
    proxy.install([
      {
        match: { url: '/api/fail' },
        respond: () => {
          throw new Error('Service Unavailable');
        },
      },
    ]);

    await expect(fetch('http://test.local/api/fail')).rejects.toThrow('Service Unavailable');
  });

  it('Scenario 4: uninstalls cleanly and restores original fetch', async () => {
    const original = globalThis.fetch;
    proxy.install([]);
    expect(globalThis.fetch).not.toBe(original);

    proxy.uninstall();
    expect(globalThis.fetch).toBe(original);
  });

  it('Scenario 5: intercepts message actions for runtime.sendMessage', async () => {
    proxy.install([
      {
        match: { action: 'getUserStatus' },
        respond: () => ({ active: true, tier: 'pro' }),
      },
    ]);

    const res = await proxy.interceptMessage('getUserStatus', { foo: 'bar' });
    expect(res.handled).toBe(true);
    expect(res.result).toEqual({ active: true, tier: 'pro' });

    const unhandled = await proxy.interceptMessage('unknownAction', {});
    expect(unhandled.handled).toBe(false);
  });
});
