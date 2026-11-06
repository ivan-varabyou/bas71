# Frontend component rules and remediation

Normative requirements: [OpenSpec](../../../openspec/specs/frontend-component-architecture/spec.md). Run the configured Angular adapter command from the consumer root; pass `--json` to its CLI wrapper for machine-readable findings. Each diagnostic links here, the [UI catalog](ui-catalog.md), and the [repair skill](../../../.agents/skills/frontend-component-design/SKILL.md).

## UI-BOUNDARY-001

Shared UI owns presentation and interaction mechanics. It must not import feature/page/app/auth/domain contracts, core/host/adapters, API/storage services, router/HTTP, or aggregate application tokens, including through barrels. Generic interfaces belong beside the primitive. Shared i18n helpers are allowed if their transitive imports respect these boundaries. Features/auth/i18n/layout cannot depend on pages/app; pages cannot depend on app.

Resolve dependencies using the package tsconfig, not string prefixes. Keep imports directional: app/pages compose features; features compose shared UI. A dialog may manage overlay, focus trapping/restoration, Escape, accessible naming and scroll locking. Record schemas, publication, relationships, API writes and persistence belong to the feature. Use content projection for static slots and template/component outlets for lazy/dynamic content. Do not encode Content Manager-specific modes in a universal dialog.

The existing modal-dialog is an entry editor requiring extraction, not an approved universal dialog. Retain donor route semantics: a full-page editor need not become an overlay.

## UI-SIZE-001

Budgets count physical lines after formatting, including comments/blanks. All production TS/HTML/CSS under frontend are scanned (test/spec/declaration/generated TS excluded). Current enforced budgets:

| Location       |  TS | HTML | CSS | Notes |
| -------------- | --: | ---: | --: | ----- |
| shared/ui      | 150 |  100 | 150 | Focused reusable atoms & molecules |
| pages          | 150 |  200 | 150 | Top-level page orchestration (HTML template strict cap <= 200 lines) |
| other frontend | 250 |  200 | 250 | Feature components and domain tabs/widgets |

> [!IMPORTANT]
> **Template Size Budgets & Refactoring Trigger**:
> - Any component or page template exceeding 150 lines triggers an architectural review warning; **exceeding 200 lines is strictly prohibited and triggers mandatory refactoring** into focused child components, dialogs, or sub-widgets.
> - **Parent/Child Subfolder Hierarchy**: Parent and child components MUST NOT sit flat on the same directory level. Feature sub-components such as tabs (`settings-*-tab`) or widgets (`dashboard-*-widget`) MUST be organized into dedicated subfolders (`features/<feature>/tabs/` or `features/<feature>/widgets/`), keeping the parent feature root clean.

Split by a named responsibility with a coherent public contract and its own markup/styles. Moving the same dependency-heavy logic into forwarding utils, numbered parts, or a giant controller does not complete remediation. Existing violations fail the gate: no silent baseline, automatic exemptions, or threshold increases to obtain green. These are project guardrails, not proof of good design; review cohesion and coupling as well.

## UI-I18N-001 & UI-HARDCODE-001

Component templates (`*.component.html`) and component classes (`*.component.ts`) must never contain hardcoded user-facing copy or inline magic fallback strings.
- **User-facing copy (`UI-I18N-001`)**: All visible text, labels, and static `title`/`placeholder`/`aria-label`/`alt` attributes must use translation keys via `vfTranslate` pipe or `i18nStore.translate(...)`.
- **System and technical constants (`UI-HARDCODE-001`)**: Technical strings (routes, identifiers, default tokens, configuration values) must be placed in a dedicated adjacent `*.constants.ts` file, where string constants are explicitly permitted.
- Run `node scripts/extract-hardcoded-text.mjs` to automatically audit and classify strings into `locales/` or `*.constants.ts`.
Decorative aria-hidden text is exempt. Do not suppress an accessibility label to satisfy this rule.

## UI-REUSE-001

Use the existing button primitive outside its own implementation. Before replacing a native button, verify form submission, native disabled state, loading, keyboard activation, accessible name, aria attributes and focus behavior. Extend the primitive if necessary; do not merely wrap an existing button or lose semantics. Other potential reuse (menus, tabs, fields) requires a suitable catalog contract; do not introduce speculative generic frameworks or placeholder components.

## UI-TEMPLATE-001

At most four nested Angular if/for/switch blocks. Extract independently testable fields, menus or block renderers. Do not flatten source formatting to evade size checks. A registry is appropriate for extensible block/field types once there is an actual typed extension contract.

## UI-SVG-001

Component templates (`*.component.html`) and TypeScript code (`*.ts`) must not contain inline `<svg>` elements or XML markup strings. Inline SVGs bloat template physical line counts, breach size budgets, and obscure semantic structure.

Extract all SVG assets into standalone `*.svg` files under `src/frontend/assets/icons/`. Render icons through the catalog primitive `<vf-icon name="...">`, which applies CSS `mask-image` with `currentColor` inheritance for monochrome icons and native `<img>` for multicolor assets. Run `pnpm extract:svg` to automatically scan and extract inline SVGs into asset files.

## UI-PARSE-001

Correct malformed Angular markup before relying on template findings. Parsing errors fail the check.

## UI-COVERAGE-001

Missing frontend source, absent TS/HTML/CSS coverage, unreadable config or scanner failure must fail, never report a clean architecture. Rename/move changes must update and test source discovery.

## Evolving rules after defects

Record the violated invariant and reproduction in OpenSpec/task evidence. For repeatable machine-checkable defects, add a failing fixture and a valid counterexample to the consumer adapter regression suite, implement the narrow rule, document its ID here and update catalog guidance when relevant. Run checker tests, real-project scan, lint and harness. For behavioral changes also run actual browser E2E and unchanged donor acceptance. Do not add a global prohibition for an isolated stylistic preference. Rules, skills and reviewer claims cannot grant donor acceptance.
