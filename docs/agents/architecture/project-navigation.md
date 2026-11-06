# Discover before implementation

Run `factory discover --query <entity>` from the consumer root before creating components, services, ports or engines. Follow returned source references and inspect contracts/consumers. Search is current lexical discovery, not a semantic symbol graph. Curated readiness in factory.project.json is authoritative; candidate or needs-refactor is not approved.

## Pre-Implementation Technical Contract Protocol

To prevent double refactoring and conserve tokens, agents must execute the 3-phase Dark Factory workflow:
1. **Discovery & Plan Report**: Run `factory discover --query <entity>`, audit reusable primitives, check size budgets, and output a concise report specifying planned files, estimated line counts (`*.component.ts` <= 250, `*.component.html` <= 150, `*.test.ts` <= 350), reused ports/contracts, and verification steps.
2. **Review & Alignment**: Review the plan against architecture limits before modifying files.
3. **Implementation & Verification**: Generate code strictly adhering to the contract, format automatically, and run `factory harness`.

Configure all production source roots and explicit language extensions in factory.project.json. Avoid overlapping scopes. Add public reusable entities with owner, status and consumer/verification references; private helpers need not be curated. Update references on moves.

`factory project-check` checks coverage, catalog references, configured size budgets and literal patterns. PROJECT-CONFIG/COVERAGE/CATALOG findings require repairing config/paths; PROJECT-SIZE requires responsibility extraction; PROJECT-HARDCODE requires configuration/ports for deployment literals. No silent baselines or automatic exceptions. Add the command to factory.config.yaml as a run stage.

UI text, dependency graphs and framework-specific template AST require an explicit adapter. Optional kit adapter `df71/adapters/angular/check` reads factory.frontend.json, uses the consumer's installed TypeScript and Angular compiler, and does not load in kit core. From the consumer root run `node --input-type=module -e "import { runCheck } from 'df71/adapters/angular/check'; runCheck()"`. The Angular profile expects shared/ui, features and pages layer names. Customize ownership deliberately before adoption; never suppress existing failures to claim acceptance.

For each demonstrated recurring defect: add a failing fixture plus valid counterexample, implement a narrow rule, document it and run behavior gates. Static checks, agent instructions and index presence do not establish production readiness. Keep independent review and exact-revision evidence.

For the optional Angular adapter also copy templates/factory.frontend.json, templates/skills/frontend-component-design, templates/docs/agents/architecture/{component-design,ui-catalog}.md and the frontend-component-architecture OpenSpec template to their matching consumer locations. These are initial projections; update local ownership and existing component readiness deliberately.
