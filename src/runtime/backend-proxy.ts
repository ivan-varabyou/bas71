export interface RequestMatch {
  url?: string | RegExp | undefined;
  method?: string | undefined;
  action?: string | undefined;
}

export interface InterceptedRequest {
  url?: string | undefined;
  method?: string | undefined;
  action?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: unknown;
}

export interface RequestHandler {
  match: RequestMatch;
  respond: (req: InterceptedRequest) => unknown | Promise<unknown>;
  delay?: number | undefined;
}

export class BackendProxy {
  private baseHandlers: RequestHandler[] = [];
  private scenarioHandlers: RequestHandler[] = [];
  private originalFetch: typeof fetch | null = null;
  private isInstalled = false;

  install(handlers: RequestHandler[] = []): void {
    this.baseHandlers = [...handlers];
    if (!this.isInstalled && typeof globalThis.fetch !== 'undefined') {
      this.originalFetch = globalThis.fetch;
      globalThis.fetch = this.handleFetch.bind(this) as typeof fetch;
      this.isInstalled = true;
    }
  }

  setScenarioHandlers(handlers: RequestHandler[] = []): void {
    this.scenarioHandlers = [...handlers];
  }

  addHandler(handler: RequestHandler): void {
    this.baseHandlers.unshift(handler);
  }

  uninstall(): void {
    if (this.isInstalled && this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
      this.isInstalled = false;
    }
  }

  async interceptMessage(action: string, payload: unknown): Promise<{ handled: boolean; result?: unknown }> {
    const handler = this.findHandler({ action });
    if (!handler) {
      return { handled: false };
    }
    if (handler.delay && handler.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, handler.delay));
    }
    const result = await handler.respond({ action, body: payload });
    return { handled: true, result };
  }

  private findHandler(criteria: { url?: string; method?: string; action?: string }): RequestHandler | null {
    const all = [...this.scenarioHandlers, ...this.baseHandlers];
    for (const h of all) {
      if (criteria.action && h.match.action) {
        if (h.match.action === criteria.action) return h;
        continue;
      }
      if (criteria.url && h.match.url) {
        const urlMatches =
          typeof h.match.url === 'string'
            ? criteria.url.includes(h.match.url)
            : h.match.url.test(criteria.url);
        if (!urlMatches) continue;

        if (h.match.method && criteria.method) {
          if (h.match.method.toUpperCase() !== criteria.method.toUpperCase()) continue;
        }
        return h;
      }
    }
    return null;
  }

  private async handleFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : 'url' in input ? input.url : input.toString();
    const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
    const handler = this.findHandler({ url, method });

    if (handler) {
      if (handler.delay && handler.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, handler.delay));
      }
      const data = await handler.respond({
        url,
        method,
        body: init?.body,
      });

      if (data instanceof Response) {
        return data;
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (this.originalFetch) {
      return this.originalFetch(input, init);
    }
    throw new Error(`[bas71:BackendProxy] unhandled fetch request to ${url}`);
  }
}
