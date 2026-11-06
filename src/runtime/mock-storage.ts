export type StorageChangeCallback = (
  changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
  areaName: string
) => void;

export class MockStorageArea {
  private readonly data = new Map<string, unknown>();
  private readonly listeners = new Set<StorageChangeCallback>();
  private readonly areaName: string;

  constructor(areaName: string, initialData?: Record<string, unknown>) {
    this.areaName = areaName;
    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        this.data.set(key, JSON.parse(JSON.stringify(value)));
      }
    }
  }

  async get(
    keys?: string | string[] | Record<string, unknown> | null
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    if (keys === null || keys === undefined) {
      for (const [key, value] of this.data.entries()) {
        result[key] = JSON.parse(JSON.stringify(value));
      }
      return result;
    }

    if (typeof keys === 'string') {
      if (this.data.has(keys)) {
        result[keys] = JSON.parse(JSON.stringify(this.data.get(keys)));
      }
      return result;
    }

    if (Array.isArray(keys)) {
      for (const key of keys) {
        if (this.data.has(key)) {
          result[key] = JSON.parse(JSON.stringify(this.data.get(key)));
        }
      }
      return result;
    }

    if (typeof keys === 'object') {
      for (const [key, defaultValue] of Object.entries(keys)) {
        if (this.data.has(key)) {
          result[key] = JSON.parse(JSON.stringify(this.data.get(key)));
        } else {
          result[key] = defaultValue;
        }
      }
      return result;
    }

    return result;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const [key, newValue] of Object.entries(items)) {
      const oldValue = this.data.get(key);
      const clonedNew = JSON.parse(JSON.stringify(newValue));
      this.data.set(key, clonedNew);
      changes[key] = { oldValue, newValue: clonedNew };
    }

    this.notifyListeners(changes);
  }

  async remove(keys: string | string[]): Promise<void> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const key of keysArray) {
      if (this.data.has(key)) {
        const oldValue = this.data.get(key);
        this.data.delete(key);
        changes[key] = { oldValue, newValue: undefined };
      }
    }

    this.notifyListeners(changes);
  }

  async clear(): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};
    for (const [key, oldValue] of this.data.entries()) {
      changes[key] = { oldValue, newValue: undefined };
    }
    this.data.clear();
    this.notifyListeners(changes);
  }

  addListener(callback: StorageChangeCallback): void {
    this.listeners.add(callback);
  }

  removeListener(callback: StorageChangeCallback): void {
    this.listeners.delete(callback);
  }

  getSnapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.data.entries()) {
      result[key] = JSON.parse(JSON.stringify(value));
    }
    return result;
  }

  private notifyListeners(
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>
  ): void {
    if (Object.keys(changes).length === 0) return;
    for (const listener of this.listeners) {
      try {
        listener(changes, this.areaName);
      } catch (err) {
        console.error('[MockStorageArea] Listener error:', err);
      }
    }
  }
}
