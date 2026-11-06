# Agent docs templates

Copy these stubs into a consumer repository as `docs/agents/**`, then thin the root `AGENTS.md` into a map that links the five layer entrypoints.

Enable harness check:

```yaml
stages:
  - id: agent-docs-map-check
    builtin: agent-docs-map-check
```

Optional additive links (cannot drop the default five):

```yaml
agentDocs:
  requiredLinks:
    - docs/agents/backend/services/example.md
```

Living SoT: Viafactory `openspec/specs/agent-docs/spec.md`.
