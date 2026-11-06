# UI reuse navigation

Curated owner/readiness metadata lives in factory.project.json. Run `factory discover --query <component-or-service>` and inspect implementation and actual consumers before adding code. Register public reusable entities with a source path, owner, status and verification/consumer references. Do not treat discovery as acceptance evidence.

Keep domain editors in features. Shared dialog shells own only composition, focus/keyboard/accessibility and overlay mechanics. Reuse a button only after verifying native form, disabled/loading and accessible naming behavior. If no suitable primitive exists, build one for the concrete task and document the consumer rather than creating a placeholder catalog entry.
