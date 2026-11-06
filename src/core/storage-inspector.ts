import type { MockChromeRuntime } from '../runtime/mock-chrome.js';

export type StorageAreaKey = 'local' | 'session' | 'sync';

export class StorageInspector {
  private modalEl: HTMLElement | null = null;
  private isVisible = false;
  private currentArea: StorageAreaKey = 'local';
  private unbindStorageListener: (() => void) | null = null;

  constructor(private readonly runtime: MockChromeRuntime) {}

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.render();
  }

  destroy(): void {
    this.isVisible = false;
    if (this.unbindStorageListener) {
      this.unbindStorageListener();
      this.unbindStorageListener = null;
    }
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
  }

  private render(): void {
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }

    if (!this.isVisible) {
      if (this.unbindStorageListener) {
        this.unbindStorageListener();
        this.unbindStorageListener = null;
      }
      return;
    }

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'vfa-modal-overlay';
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.toggle();
      }
    });

    const modalWindow = document.createElement('div');
    modalWindow.className = 'vfa-modal-window';

    const header = document.createElement('div');
    header.className = 'vfa-modal-header';

    const titleEl = document.createElement('span');
    titleEl.textContent = 'Storage Inspector';
    header.appendChild(titleEl);

    // Area tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'vfa-stand-btn-group';
    const areas: StorageAreaKey[] = ['local', 'session', 'sync'];

    for (const area of areas) {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = `vfa-stand-btn${this.currentArea === area ? ' active' : ''}`;
      tabBtn.textContent = area.charAt(0).toUpperCase() + area.slice(1);
      tabBtn.addEventListener('click', () => {
        this.currentArea = area;
        this.render();
      });
      tabsContainer.appendChild(tabBtn);
    }
    header.appendChild(tabsContainer);

    const actions = document.createElement('div');
    actions.className = 'vfa-stand-btn-group';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'vfa-stand-btn';
    clearBtn.textContent = `Clear ${this.currentArea}`;
    clearBtn.addEventListener('click', async () => {
      await this.runtime.storage[this.currentArea].clear();
      this.render();
    });
    actions.appendChild(clearBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'vfa-stand-btn';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', () => this.toggle());
    actions.appendChild(closeBtn);

    header.appendChild(actions);

    const content = document.createElement('pre');
    content.className = 'vfa-modal-content';
    content.textContent = JSON.stringify(this.runtime.storage[this.currentArea].getSnapshot(), null, 2);

    modalWindow.appendChild(header);
    modalWindow.appendChild(content);
    this.modalEl.appendChild(modalWindow);
    document.body.appendChild(this.modalEl);

    if (!this.unbindStorageListener) {
      const storageListener = () => {
        if (this.isVisible) this.render();
      };
      this.runtime.storage.onChanged.addListener(storageListener);
      this.unbindStorageListener = () => {
        this.runtime.storage.onChanged.removeListener(storageListener);
      };
    }
  }
}
