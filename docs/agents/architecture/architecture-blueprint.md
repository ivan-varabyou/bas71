# Architecture blueprint before implementation

## Position in the development loop

Discovery → Architecture Blueprint → architecture review and paper decomposition → RED → implementation → harness → independent review.

Before creating or modifying feature source or tests, create `openspec/changes/<change>/architecture-blueprint.md` using the kit template. For a task under an archived requirement, create a task-specific design artifact under `docs/reviews/<task>/architecture-blueprint.md` and link it from the task. Requirements remain in OpenSpec; the blueprint records implementation decisions, never new behavior.

This is a mandatory agent workflow checkpoint. The current executable harness does not parse blueprints or verify projected imports or line counts. OpenSpec validation checks specification structure, not architecture-plan completeness. Do not report an automated blueprint PASS until a separately specified and tested deterministic validator exists. Existing source architecture checks and donor acceptance remain mandatory.

## 1. Gather evidence

- Cite the requirement, scenarios, task, affected routes and donor inventory where applicable.
- Record the working revision and relevant uncommitted changes; do not treat another agent's changes as your implementation.
- Run `factory discover --query <domain>` and repeat for candidate symbols and consumers.
- Inspect the actual contracts and consumers, ownership/readiness catalog and layer instructions.
- Run `factory project-check` and the applicable stack architecture checks; record command, exit code and findings.
- Record the exact policy/configuration sources and effective physical-line budgets for each planned file type and scope.
- Use the strictest applicable budget. If requirements conflict beyond a stricter compatible bound, record a blocking decision; never silently choose the largest allowance.
- Existing violations are findings, not an approved baseline. Distinguish existing issues from projected ones without removing either from acceptance.

## 2. Describe the complete future tree

Include every new, modified, moved, deleted and reused file required for the feature: production code, templates, styles, interfaces, tokens, constants, pure utilities, adapters, providers, route registration, translations, tests, fixtures, configuration and documentation. Use exact repository-relative paths, not `helpers/*`, ellipses or unnamed future components.

Each leaf includes an operation, one responsibility, owner/layer, current lines, estimated final lines, effective cap, headroom and stable file ID. Estimate final total size for modified files, not only added lines. New files start at zero. Reused unchanged files retain their current size. Count physical lines after normal formatting, including blanks. Generated outputs are labeled with their source generator and are never edited directly.

For each estimate, break the total into responsibility blocks such as public contract, state, validation, orchestration and rendering. Record uncertainty and an upper estimate; the upper estimate must fit the budget. Record headroom as planning information, not a new minimum reserve. Estimates are planning evidence, not a guarantee of actual size.

List directory subtotals and feature totals by operation. Totals aid review but do not replace per-file limits. Attach a detail card for every file using the template.

## 3. Describe dependencies and behavior

- List each planned import/usage edge by source ID, target path and exported symbol; state why the layer direction is allowed.
- Separate runtime calls, type dependencies, component composition and event publication/subscription.
- For each port, identify interface, token, implementation, provider binding, composition root and consumer. Portable engines must not import consumer adapters.
- Trace each use case: route → page → shared component → handler/state → port → adapter → endpoint → state/render update.
- Name state owners, inputs/outputs, event payload contracts, subscription cleanup and error/loading/empty/permission behavior.
- Map every interactive control to a real action and verification scenario. No placeholder handlers or invented backend capabilities.
- Explain cycle avoidance and shared boundaries. Shared modules cannot depend on feature-private pages or services.

## 4. Decide reuse before creating files

For every needed capability, record discovery query, exact existing path/symbol, catalog readiness, actual consumer/test evidence and the decision: reuse unchanged, extend contract, compose locally or create shared.

A catalog entry is not approval. Inspect candidates and entries marked needs-refactor. Record missing capabilities and a focused extraction plan before relying on them. A negative lexical search is not proof of absence; search synonyms and ownership scopes.

Apply Rule of 2 to both current and planned consumers. Name at least two concrete consumers when extracting a cross-page primitive. Keep domain composition local where no shared contract is demonstrated. Do not introduce speculative frameworks.

## Budget proportionality

This checkpoint introduces no new universal line caps, mandatory reserve percentage, file-count targets or dependency-count limits. Apply existing configured policies for the actual scope; do not copy illustrative budgets into enforcement. Where no cap exists, record N/A with the policy source and review cohesion instead of inventing a limit.

Line estimates are approximate. A small estimate deviation within existing policy is not a reason to split a coherent file. Re-review material responsibility/contract changes and actual policy breaches. Soft warnings require inspection; they require decomposition only where the existing policy explicitly says so. Prefer a cohesive module over many tiny forwarding files. Plan detail should cover every affected file without expanding unrelated repository trees.

## 5. Refactor the design on paper

Mark a file BLOCKED if its upper estimate exceeds a cap, reaches a mandatory refactoring threshold, combines unrelated responsibilities, owns multiple independent dialogs/tables/toolbars, duplicates a shared capability, reverses a layer dependency or becomes a dependency hub without a coherent contract.

For every finding, show the rejected tree fragment, reason/rule, replacement files with budgets, redistributed responsibilities and new edges. Recompute totals and update all references. No production code is needed to perform this decomposition.

Do not evade limits using forwarding utilities, numbered fragments, giant services/controllers, compressed formatting or increased thresholds. Small files can still have poor cohesion; review responsibilities and dependencies as well as counts.

## 6. Architecture review checkpoint

Review every file and edge against the applicable OpenSpec, IoC, naming, size, reuse, template, i18n, accessibility and security rules. Record a matrix: rule/source → file/edge IDs → evidence → result → required correction.

Allowed plan states: DRAFT, BLOCKED, READY_FOR_RED. READY_FOR_RED requires complete inventory, explained reuse decisions, bounded estimates, complete behavior/test mapping and zero unresolved plan findings. Record reviewer identity and blueprint revision; author self-check is not independent security/OpenSpec review. Follow the existing distinct-model review policy where those roles apply; do not manufacture review evidence.

A change in scope, file inventory, dependencies, public contracts or budget invalidates the affected review rows. Update and recheck the blueprint before implementing that change. No new approval ceremony is introduced for routine authorized work.

## 7. Verify implementation against the plan

Before implementation, list exact test/check commands and map scenarios to planned test files. For UI changes include real DOM click-through, routes and required viewports. For donor features hydrate and formulate RED scenarios before feature code.

After implementation compare actual changed paths, formatted physical lines, imports, contracts and shared consumers to the blueprint. Record deviations and correct the design or implementation without loosening rules. Run existing architecture, test, harness and donor gates. A reviewed blueprint cannot grant implementation acceptance or replace `pnpm verify`.
