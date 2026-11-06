# bas71 (Browser Addon Stand 7-1)

> Universal, framework-agnostic standalone development harness and mock Chrome Extension runtime for developing browser extensions in standard browser tabs with instant HMR and `df71` Dark Factory harness under the hood.
> Supports **Vue 3**, **React 18/19**, **Angular**, **Svelte**, and **Vanilla JS**.

[![Harness](https://img.shields.io/badge/df71-Dark%20Factory-black.svg)](https://github.com/ivan-varabyou/df71)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## ⚡ Overview / Обзор

Developing browser extensions by loading unpackaged extensions in `chrome://extensions` is slow and painful:
* Extensions lose internal state on every code edit or window blur.
* Popups close whenever you click outside or open DevTools.
* No comfortable Vue/React DevTools inspection in standard extension overlays.
* Slow feedback loop without true Hot Module Replacement (HMR).

`bas71` runs your browser extension in a regular browser tab (`http://localhost:5173/stand.html`) with:
* **Zero framework lock-in**: Works with Vue 3, React, Svelte, Angular, or Vanilla JS.
* **Built-in Mock Chrome Extension Runtime**: Polyfills `chrome.runtime`, `chrome.storage.local/session/sync`, `chrome.tabs`, `chrome.action`, and `browser.*`.
* **Universal Viewport Switcher**: Emulate `Popup (780x580)`, `SidePanel (400px)`, in-page `Overlay (94%)`, `DevTools panel`, or `Fullscreen`.
* **Custom Project Controls**: Add project-specific toggles, buttons, selects, and counters to the stand toolbar (e.g. session tier, mock data scenarios, recording toggles).
* **Built-in Storage Inspector**: View, inspect, and clear `chrome.storage.local` with one click.
* **DevTools Integration**: Built-in support for `dev71` DOM-to-source inspector and AI clipboard context generation.
* **DF71 Harness Quality Gate**: Maintained under the strict standards of the `df71` autonomous engineering harness.

---

## 📦 Installation

```bash
# In pnpm monorepo:
pnpm add -D bas71

# Or via npm/yarn:
npm install -D bas71
```

Import styles in your stand entry file:
```ts
import 'bas71/styles.css';
```

---

## 🚀 Quick Integration Protocol (Under 5 Minutes)

### Step 1: Create `stand.html` in project root
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extension Dev Stand</title>
  </head>
  <body>
    <div id="stand-root"></div>
    <script type="module" src="/src/stand/main.ts"></script>
  </body>
</html>
```

### Step 2: Create entry file (`src/stand/main.ts`)
```ts
import { createAddonStand } from 'bas71';
import 'bas71/styles.css';
import { mountApp } from '../main';

createAddonStand({
  target: '#stand-root',
  title: 'My Extension',
  defaultViewport: 'popup',
  defaultTheme: 'dark',
  initialStorage: {
    local: {
      settings: { enabled: true },
    },
  },
  // Custom controls:
  controls: [
    {
      type: 'toggle',
      id: 'rec',
      label: '● REC',
      value: (state) => Boolean(state['isRecording']),
      onChange: (checked, ctx) => ctx.setState({ isRecording: checked }),
    },
  ],
  mount: ({ container, theme, viewport, runtime }) => {
    const app = mountApp(container);
    return () => {
      app?.unmount?.();
    };
  },
});
```

### Step 3: Add npm script
In `package.json`:
```json
"scripts": {
  "dev:stand": "vite --open /stand.html"
}
```

> **CRITICAL BUNDLE ISOLATION RULE:**
> Ensure your production bundler config (e.g. `vite.config.ts`, `rollup.config.js`) only specifies extension entry points in `rollupOptions.input`. `stand.html` and `src/stand/**` must not be bundled into the production extension distribution.

---

## 🧩 Framework Adapters

### 1. Vue 3
```ts
import { createApp } from 'vue';
import { defineVueAddonStand } from 'bas71/vue';
import 'bas71/styles.css';
import App from './App.vue';

defineVueAddonStand({
  title: 'My Vue Extension',
  defaultViewport: 'popup',
  initialState: {
    isRecording: true,
    userRole: 'pro',
  },
  createApp: ({ state, onStateChange }) => {
    const app = createApp(App, { initialState: state });
    onStateChange((newState) => {
      // sync state
    });
    return app;
  },
});
```

### 2. React (18 / 19)
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineReactAddonStand } from 'bas71/react';
import 'bas71/styles.css';
import { App } from './App';

defineReactAddonStand({
  title: 'My React Extension',
  defaultViewport: 'popup',
  createRoot: (container) => createRoot(container),
  render: ({ state, theme }) => <App state={state} theme={theme} />,
});
```

### 3. Svelte
```ts
import { createAddonStand } from 'bas71';
import 'bas71/styles.css';
import App from './App.svelte';

createAddonStand({
  title: 'My Svelte Extension',
  mount: ({ container, state }) => {
    const app = new App({ target: container, props: { state } });
    return () => {
      app.$destroy();
    };
  },
});
```

### 4. Angular
```ts
import { createAddonStand } from 'bas71';
import 'bas71/styles.css';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

createAddonStand({
  title: 'My Angular Extension',
  mount: async ({ container }) => {
    const appRef = await bootstrapApplication(AppComponent, { providers: [] });
    return () => {
      appRef.destroy();
    };
  },
});
```

---

## 🛠️ df71 Quality Harness

`bas71` enforces strict architectural discipline and clean code using `df71` (Dark Factory 7-1):

```bash
# Run all 5 stages of the harness
npm run harness

# Check physical line budgets (<= 350 lines per file)
npm run check:line-budgets

# Check project policy rules
npm run project-check
```

---

## 📄 License

Apache License 2.0 © Ivan Varabyou
