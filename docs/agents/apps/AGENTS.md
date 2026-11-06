# Apps (agent layer)

Purpose: Stand shell, viewport orchestration, and dev harness integration for browser extensions.

**Up:** [root AGENTS.md](../../../AGENTS.md)

## Universal Extension Stand Integration Pattern

To integrate `bas71` into an extension project without framework lock-in:

1. **Mount Point**: Dedicated dev-only entry point (e.g. `stand.html` + `src/stand/main.ts`).
2. **Bundle Isolation**: Must be isolated from production extension build targets.
3. **Stand Lifecycle**:
   - `createAddonStand({ target, mount, scenarios, backend })` creates the isolated harness.
   - `mount({ container, runtime, state, setState, onStateChange })` mounts the extension UI.
   - Return clean unmount callback from `mount` to allow hot reloading without memory leaks.
4. **Interactive Controls & Viewports**:
   - Emulate Extension Popup (780x580), SidePanel (400px), In-page Overlay (94%), or DevTools panel.
   - Add custom toolbar buttons, toggles, badges, and scenario selectors.
