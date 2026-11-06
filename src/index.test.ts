// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAddonStand,
  createMockChromeRuntime,
  MockStorageArea,
} from './index.js';

describe('bas71', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('MockStorageArea', () => {
    it('stores, retrieves and clears data correctly', async () => {
      const storage = new MockStorageArea('local', { initialKey: 'initVal' });
      expect(await storage.get('initialKey')).toEqual({ initialKey: 'initVal' });

      await storage.set({ newKey: 123 });
      expect(await storage.get('newKey')).toEqual({ newKey: 123 });

      await storage.remove('initialKey');
      expect(await storage.get('initialKey')).toEqual({});

      await storage.clear();
      expect(await storage.get(null)).toEqual({});
    });

    it('notifies change listeners when data updates', async () => {
      const storage = new MockStorageArea('local');
      const listener = vi.fn();
      storage.addListener(listener);

      await storage.set({ count: 1 });
      expect(listener).toHaveBeenCalledWith(
        { count: { oldValue: undefined, newValue: 1 } },
        'local'
      );
    });
  });

  describe('createMockChromeRuntime', () => {
    it('handles sendMessage and onMessage listeners', async () => {
      const runtime = createMockChromeRuntime();
      const messageListener = vi.fn(async (msg: unknown) => ({ echo: msg }));
      runtime.runtime.onMessage.addListener(messageListener);

      const response = await runtime.runtime.sendMessage({ ping: true });
      expect(response).toEqual({ echo: { ping: true } });
      expect(runtime.log).toHaveLength(1);
    });
  });

  describe('createAddonStand', () => {
    it('initializes DOM and calls mount callback', async () => {
      const target = document.createElement('div');
      target.id = 'stand-app';
      document.body.appendChild(target);

      const unmountSpy = vi.fn();
      const mountSpy = vi.fn((context: { container: HTMLElement }) => {
        context.container.innerHTML = '<div class="test-content">Loaded</div>';
        return unmountSpy;
      });

      const stand = createAddonStand({
        target,
        title: 'Universal Extension Stand',
        mount: mountSpy,
      });

      expect(mountSpy).toHaveBeenCalledTimes(1);
      expect(target.querySelector('.test-content')?.textContent).toBe('Loaded');
      expect(target.querySelector('.vfa-stand-toolbar')).toBeTruthy();

      stand.reload();
      expect(unmountSpy).toHaveBeenCalledTimes(1);
      expect(mountSpy).toHaveBeenCalledTimes(2);

      stand.destroy();
      expect(unmountSpy).toHaveBeenCalledTimes(2);
    });

    it('manages custom controls and reactive state', async () => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      interface CustomState extends Record<string, unknown> {
        mode: string;
        isRecording: boolean;
      }

      let receivedState: CustomState | null = null;

      const stand = createAddonStand<CustomState>({
        target,
        initialState: { mode: 'dev', isRecording: false },
        controls: [
          {
            type: 'toggle',
            id: 'rec-toggle',
            label: 'REC',
            value: (state) => state.isRecording,
            onChange: (checked, ctx) => {
              ctx.setState({ isRecording: checked });
            },
          },
          {
            type: 'select',
            id: 'mode-select',
            label: 'Mode:',
            options: [
              { label: 'Dev', value: 'dev' },
              { label: 'Prod', value: 'prod' },
            ],
            value: (state) => state.mode,
            onChange: (val, ctx) => {
              ctx.setState({ mode: val });
            },
          },
        ],
        mount: (context) => {
          receivedState = context.state;
          context.onStateChange((newState) => {
            receivedState = newState;
          });
        },
      });

      expect(receivedState).toEqual({ mode: 'dev', isRecording: false });

      stand.setState({ isRecording: true, mode: 'prod' });
      expect(receivedState).toEqual({ mode: 'prod', isRecording: true });

      stand.destroy();
    });
  });
});
