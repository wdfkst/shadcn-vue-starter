# Vue Admin Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. User approved direct execution; no commits.

**Goal:** Deliver a runnable Chinese Vue admin starter and real source-code generator.
**Architecture:** Vue Router and Pinia handle the shell/auth. Schema-driven CRUD consumes an interchangeable mock/HTTP repository. Browser and CLI share a validated generator definition; generated modules use the same CRUD component and are discovered by glob imports.
**Tech Stack:** Vue 3, Vite, TypeScript, Tailwind 4, Reka UI/shadcn-vue conventions, Pinia, Zod, Vitest.
**Spec:** ../specs/2026-11-11-admin-template.md

## Global Constraints
- New standalone sibling directory; preserve original React code. No git commits/pushes.
- Match original slate theme, 16rem sidebar, h-16 header, px-4 py-6 content. No default page tabs.
- Frontend only, mock mode explicit. No claims of server-side authorization.
- Generated paths must stay in project; refuse existing outputs. Generated modules compile.

## Review Focus
- Invalid/traversal generator names and source injection must be rejected or safely serialized (Task 3).
- Duplicate output files/symlink ancestors must never overwrite user code (Task 3).
- Persistence unavailable/corrupt must not crash app (Task 1).
- Viewer cannot mutate via UI or mock repository; real backend must authorize (Task 2).
- Required/number/boolean field handling and pagination after deletion (Task 2).

## Task 1: Shell and auth
Files: src/main.ts, App.vue, router/index.ts, stores/auth.ts, stores/preferences.ts, layouts/AdminLayout.vue, pages/LoginPage.vue, lib/storage.ts.
Interfaces: session {username,role}; can(permission); module route meta.permission.
- [ ] Write tests for corrupt storage and role permissions; run and observe missing implementation.
- [ ] Implement session persistence, login/logout, accessible responsive shell and theme/layout preferences.
- [ ] Verify tests and vue-tsc/build.

## Task 2: CRUD and management
Files: src/modules/registry.ts, types/module.ts, lib/repository.ts, components/crud/CrudPage.vue, pages/SettingsPage.vue, tests/repository.test.ts.
Interfaces: ModuleDefinition {key,title,description,fields,readOnly?}; repository list/create/update/remove; PageResult {items,total}.
- [ ] Write failing tests for CRUD query/filter/pagination, invalid values, permission denial and read-only logs.
- [ ] Implement seeded local data, validation, mock/HTTP toggle, users/roles/menus/departments/dictionaries/logs, CRUD dialogs, CSV and pagination.
- [ ] Run suite; verify browser workflows.

## Task 3: Generator
Files: src/generator/core.ts, pages/GeneratorPage.vue, cli/generate.mjs, cli/writer.mjs, tests/generator.test.ts.
Interfaces: validateConfig, generateFiles(config): Record<relativePath,string>; writeFiles(root,files) rejects collisions/symlinks.
- [ ] Test invalid identifiers/routes, escaping, generated SFC compilation, collision/no partial writes and traversal.
- [ ] Implement config editor, preview, config export, CLI and auto-discovered generated modules.
- [ ] Run tests and actual generate/build; verify output no-overwrite behavior.

## Task 4: Verification and docs
- [ ] Browser-check login, CRUD, generator, theme and mobile; fix defects.
- [ ] Run full tests/build, start local server; document commands, credentials, API contracts, limitations and license.

## Execution ledger
Ruling: Work directly in the explicitly requested standalone sibling folder, not in React worktree. No commit steps because user did not authorize commits.
Ruling: Existing agent left dependencies/styles/UI wrappers but no plan or app. Resume those assets; no claim that all wrappers came from official CLI.
Ruling: First release generated code reuses a reusable CRUD component; module schema/API/route files remain editable. Regeneration never overwrites files.
