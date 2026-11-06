# Architecture (agent layer)

Purpose: system shape and non-obvious invariants for this repository.

**OpenSpec:** cite living modules under `openspec/specs/` that this page summarizes.

**Up:** [root AGENTS.md](../../../AGENTS.md)  
**Down:** add child notes as needed (domains, diagrams).

Do not invent behavior absent from living OpenSpec. English only.

## Universal Dark Factory Protocol (Discovery -> Plan -> Implement)

Every development task MUST execute this 3-phase protocol to eliminate token waste and guarantee zero-refactoring implementation:

1. **Phase 1: Discovery & Technical Contract Formulation**
   - Run `factory discover --query <entity>` to discover existing components, services, and ports before writing new code.
   - Run `factory project-check` to confirm size budgets and policy compliance.
   - Produce a pre-implementation Technical Contract plan specifying target files, expected line counts (enforcing `*.component.ts` <= 250 lines, `*.component.html` <= 150 lines, `*.test.ts` <= 350 lines), shared reusable elements to consume, and zero-stub guarantees.
   - **Mandatory Adjacent Entity API Contract (`*.api.md`)**: Reusable shared UI components and domain primitives must have adjacent `*.api.md` files describing Inputs, Outputs, and usage examples. Whenever an entity's interface changes, its `*.api.md` must be updated in the same change.
   - **Zero SVG in Code & Templates (`UI-SVG-001`)**: Inline `<svg>` in templates and hardcoded SVG XML strings in TypeScript are strictly prohibited. SVGs must live exclusively in dedicated `*.svg` asset files; consume via `<vf-icon>` using `mask-image` or `<img>`. Run `pnpm extract:svg` to automate extraction.

2. **Phase 2: Plan Review & Alignment**
   - Audit the technical contract against layer boundaries and invariants before modifying files.

3. **Phase 3: Implementation & Deterministic Verification**
   - Write code according to the technical contract.
   - Run the deterministic harness gate (`factory harness`).


## Architecture Blueprint before RED

Follow [Architecture Blueprint](architecture-blueprint.md) after discovery, before source/test implementation. Copy the kit `templates/architecture-blueprint.md` into the change or task design artifact. Review every planned file, budget, dependency and reuse decision; resolve findings through paper decomposition before READY_FOR_RED. This is a workflow checkpoint, not an executable harness builtin.
