import type {
  StandOptions,
  StandTheme,
  StandContext,
  ViewportDefinition,
  AddonStandInstance,
} from './types.js';
import {
  createMockChromeRuntime,
  injectMockChromeGlobal,
} from '../runtime/mock-chrome.js';
import { mountDevTools } from 'dev71';
import { StandToolbar } from './toolbar.js';
import { DEFAULT_VIEWPORTS } from './viewports.js';

export function createAddonStand<TState extends Record<string, unknown> = Record<string, unknown>>(
  options: StandOptions<TState>
): AddonStandInstance<TState> {
  if (typeof document === 'undefined') {
    throw new Error('createAddonStand must be executed in a browser DOM environment');
  }

  let rootContainer: HTMLElement;
  if (!options.target) {
    rootContainer = document.body;
  } else if (typeof options.target === 'string') {
    const el = document.querySelector<HTMLElement>(options.target);
    if (!el) {
      throw new Error(`Target container selector "${options.target}" not found in DOM`);
    }
    rootContainer = el;
  } else {
    rootContainer = options.target;
  }

  const runtime = createMockChromeRuntime({
    manifest: options.manifest,
    initialStorage: options.initialStorage,
  });
  injectMockChromeGlobal(runtime);

  const viewportsList: ViewportDefinition[] = options.viewports ?? DEFAULT_VIEWPORTS;
  const initialViewportId = options.defaultViewport ?? viewportsList[0]?.id ?? 'popup';

  let currentViewport = initialViewportId;
  let currentTheme: StandTheme = options.defaultTheme ?? 'dark';
  let currentState: TState = (options.initialState ?? {}) as TState;
  let isInspectingStorage = false;

  const stateListeners = new Set<(state: TState) => void>();
  const themeListeners = new Set<(theme: StandTheme) => void>();
  const viewportListeners = new Set<(viewport: string) => void>();
  let currentUnmount: (() => void) | null = null;

  // Root DOM
  const standWrapper = document.createElement('div');
  standWrapper.className = 'vfa-stand';

  const stage = document.createElement('main');
  stage.className = 'vfa-stand-stage';

  const backdrop = document.createElement('div');
  backdrop.className = 'vfa-simulated-backdrop';
  stage.appendChild(backdrop);

  const viewportContainer = document.createElement('div');
  viewportContainer.className = 'vfa-stand-viewport';
  stage.appendChild(viewportContainer);

  function applyViewportStyles(vpId: string): void {
    const def = viewportsList.find((v) => v.id === vpId) ?? viewportsList[0];
    stage.setAttribute('data-viewport', vpId);
    stage.setAttribute('data-dock', def?.dock ?? 'center');

    if (def) {
      viewportContainer.style.width = typeof def.width === 'number' ? `${def.width}px` : def.width ?? '100%';
      viewportContainer.style.height = typeof def.height === 'number' ? `${def.height}px` : def.height ?? '100%';
      viewportContainer.style.maxWidth = typeof def.maxWidth === 'number' ? `${def.maxWidth}px` : def.maxWidth ?? 'none';
      viewportContainer.style.maxHeight = typeof def.maxHeight === 'number' ? `${def.maxHeight}px` : def.maxHeight ?? 'none';
      viewportContainer.style.borderRadius = def.borderRadius ?? '0';
      viewportContainer.style.boxShadow = def.boxShadow ?? 'none';
    }
  }

  function applyTheme(theme: StandTheme): void {
    viewportContainer.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  let devToolsInstance: { toggle: () => void; destroy?: () => void } | null = null;
  if (options.devtools !== false) {
    try {
      const devToolsOpts = typeof options.devtools === 'object' ? options.devtools : {};
      devToolsInstance = mountDevTools({
        showTriggerPill: false,
        ...devToolsOpts,
      });
    } catch (err) {
      console.warn('[AddonStand] DevTools initialization skipped:', err);
    }
  }

  const context: StandContext<TState> = {
    get state() {
      return currentState;
    },
    get currentViewport() {
      return currentViewport;
    },
    get currentTheme() {
      return currentTheme;
    },
    runtime,
    setState(updater) {
      const partial = typeof updater === 'function' ? updater(currentState) : updater;
      currentState = { ...currentState, ...partial };
      toolbar.update();
      for (const listener of stateListeners) {
        try {
          listener(currentState);
        } catch (err) {
          console.error('[AddonStand] State change listener error:', err);
        }
      }
    },
    setViewport(vpId: string) {
      currentViewport = vpId;
      applyViewportStyles(vpId);
      toolbar.update();
      for (const listener of viewportListeners) {
        try {
          listener(vpId);
        } catch (err) {
          console.error('[AddonStand] Viewport listener error:', err);
        }
      }
    },
    setTheme(th: StandTheme) {
      currentTheme = th;
      applyTheme(th);
      toolbar.update();
      for (const listener of themeListeners) {
        try {
          listener(th);
        } catch (err) {
          console.error('[AddonStand] Theme listener error:', err);
        }
      }
    },
    reload() {
      executeMount();
    },
    toggleStorageInspector() {
      isInspectingStorage = !isInspectingStorage;
      renderStorageModal();
    },
    toggleDevTools: devToolsInstance ? () => devToolsInstance?.toggle() : undefined,
  };

  const toolbar = new StandToolbar<TState>({
    title: options.title ?? (options.manifest?.['name'] as string | undefined) ?? 'Extension Stand',
    viewports: viewportsList,
    controls: options.controls,
    context,
  });

  standWrapper.appendChild(toolbar.element);
  standWrapper.appendChild(stage);
  rootContainer.appendChild(standWrapper);

  applyViewportStyles(currentViewport);
  applyTheme(currentTheme);

  function executeMount(): Promise<void> {
    if (currentUnmount) {
      try {
        currentUnmount();
      } catch (err) {
        console.error('[AddonStand] Error unmounting previous instance:', err);
      }
      currentUnmount = null;
    }

    viewportContainer.innerHTML = '';
    const mountResult = options.mount({
      container: viewportContainer,
      viewport: currentViewport,
      theme: currentTheme,
      runtime,
      state: currentState,
      setState: context.setState,
      onStateChange(listener) {
        stateListeners.add(listener);
        return () => stateListeners.delete(listener);
      },
      onThemeChange(listener) {
        themeListeners.add(listener);
        return () => themeListeners.delete(listener);
      },
      onViewportChange(listener) {
        viewportListeners.add(listener);
        return () => viewportListeners.delete(listener);
      },
    });

    if (mountResult instanceof Promise) {
      return mountResult.then((fn) => {
        if (typeof fn === 'function') {
          currentUnmount = fn;
        }
      });
    }

    if (typeof mountResult === 'function') {
      currentUnmount = mountResult;
    }
    return Promise.resolve();
  }

  // Storage Inspector Modal
  let storageModalEl: HTMLElement | null = null;
  function renderStorageModal(): void {
    if (storageModalEl) {
      storageModalEl.remove();
      storageModalEl = null;
    }

    if (!isInspectingStorage) return;

    storageModalEl = document.createElement('div');
    storageModalEl.className = 'vfa-modal-overlay';
    storageModalEl.addEventListener('click', (e) => {
      if (e.target === storageModalEl) {
        isInspectingStorage = false;
        renderStorageModal();
      }
    });

    const modalWindow = document.createElement('div');
    modalWindow.className = 'vfa-modal-window';

    const header = document.createElement('div');
    header.className = 'vfa-modal-header';
    header.innerHTML = '<span>Storage Inspector (chrome.storage.local)</span>';

    const actions = document.createElement('div');
    actions.className = 'vfa-stand-btn-group';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'vfa-stand-btn';
    clearBtn.textContent = 'Clear Storage';
    clearBtn.addEventListener('click', async () => {
      await runtime.storage.local.clear();
      renderStorageModal();
    });
    actions.appendChild(clearBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'vfa-stand-btn';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', () => {
      isInspectingStorage = false;
      renderStorageModal();
    });
    actions.appendChild(closeBtn);

    header.appendChild(actions);

    const content = document.createElement('pre');
    content.className = 'vfa-modal-content';
    content.textContent = JSON.stringify(runtime.storage.local.getSnapshot(), null, 2);

    modalWindow.appendChild(header);
    modalWindow.appendChild(content);
    storageModalEl.appendChild(modalWindow);
    document.body.appendChild(storageModalEl);
  }

  executeMount();

  return {
    destroy() {
      if (currentUnmount) {
        currentUnmount();
        currentUnmount = null;
      }
      if (storageModalEl) {
        storageModalEl.remove();
      }
      if (devToolsInstance?.destroy) {
        devToolsInstance.destroy();
      }
      standWrapper.remove();
    },
    reload: context.reload,
    setViewport: context.setViewport,
    setTheme: context.setTheme,
    setState: context.setState,
    getState: () => currentState,
    getContext: () => context,
  };
}
