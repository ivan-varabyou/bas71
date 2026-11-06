<!-- df71:rules:start -->
## Dark Factory Rules (Generic Project) [df71]
- All handwritten source files must adhere strictly to physical line limits.
- Universal Make Façade: use `make env`, `make dev`, `make test`, `make df71:check`.
- Pre-task Git Hygiene: run `df71 stage-check --pre-task` before any task; stage must be clean with zero temp/secret/screenshot files.
- Companion API contracts: shared entities/components should have a companion `<name>.api.md` (≤ 60 lines) documenting public contract so agents minimize read calls.
### Project Architecture & Rules
- Keep all handwritten source files ≤ 220 physical lines.
- Always run tests and df71:check before committing.
- Ensure all environment variables are documented in .env.example.
- Dev mode: use `make dev` to run the local server.
<!-- df71:rules:end -->

# bas71 Development & Integration Rules

> Browser Addon Stand (`bas71`) — Standalone Browser Extension Development Harness with `df71` under the hood.

---

## 1. Architecture & Hard Limits

### Size and decomposition limits
Strict physical line count limits per handwritten file:

| Category | Maximum lines |
| --- | ---: |
| Entry, public API, index | 100 |
| Adapters, runtime mocks | 250 |
| Toolbar, controls, viewports | 250 |
| Stand shell & instance | 350 |
| Hard limit for any handwritten file | 350 |

- Every handwritten file in `src/` and `scripts/` must remain strictly <= 350 physical lines.
- When approaching 300 lines, extract a named, cohesive responsibility into a sub-module.
- Do not disable lint or minification to bypass line budgets.

---

## 2. Harness & Verification Pipeline (`df71` under the hood)

Before any commit or release, all 5 stages of the harness must pass:

```bash
npm run harness
```

The pipeline executes in fail-closed order:
1. `bas71-typecheck`: `npm run typecheck` — Strict TypeScript type-checking.
2. `bas71-test`: `npm test` — Vitest unit and integration test suite.
3. `bas71-line-budgets`: `npm run check:line-budgets` — Validates physical line limits across all files.
4. `bas71-project-check`: `npm run project-check` — `df71 project-check` validating entity catalog and anti-hardcoding policies.
5. `bas71-build`: `npm run build` — Dual build: compiles TypeScript definitions and copies stylesheets.

---

## 3. Extension Stand Integration Protocol

When integrating `bas71` into an extension project:

1. **Zero Framework Lock-in**: The core package stays lightweight and framework-agnostic. Framework adapters (`bas71/vue`, `bas71/react`) are optional subpath exports.
2. **Never overwrite existing `chrome.*`**: `injectMockChromeGlobal` only assigns when `window.chrome` is undefined.
3. **Always Clean Up on Reload**: When `stand.reload()` is invoked, the previous unmount callback is guaranteed to run before mounting the next instance.
4. **DevTools Integration**: Seamlessly integrates with `dev71` for DOM-to-source inspection and AI clipboard context generation.
