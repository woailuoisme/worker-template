<!--
  Sync Impact Report: 1.0.0 -> 1.1.0
  - Updated Core Principles:
    - [PRINCIPLE_1_NAME] -> I. Code Quality (Biome & Types)
    - [PRINCIPLE_2_NAME] -> II. Testing Standards (Vitest TDD)
    - [PRINCIPLE_3_NAME] -> III. User Experience Consistency (Hono & Zod OpenAPI)
    - [PRINCIPLE_4_NAME] -> IV. Performance Requirements (Cloudflare Workers)
    - [PRINCIPLE_5_NAME] -> V. Observability (Logtape)
  - Templates requiring updates:
    - .specify/templates/plan-template.md (✅ updated)
    - .specify/templates/spec-template.md (✅ updated)
    - .specify/templates/tasks-template.md (✅ updated)
  - Follow-up TODOs: Determine RATIFICATION_DATE.
-->

# worker-template Constitution

## Core Principles

### I. Code Quality (Biome & Types)
All code MUST be type-safe and adhere to the project's Biome configuration. TypeScript 'any' types are strictly forbidden unless accompanied by a technical justification comment. All public-facing API structures MUST use Zod schemas for validation and type inference. Use `npm run check` to verify linting, types, and dead code before any commit.

### II. Testing Standards (Vitest TDD)
New features SHOULD follow a test-driven development (TDD) approach using Vitest. Unit tests ARE REQUIRED for all business logic in `src/lib` and `src/services`. Integration tests MUST cover happy paths for all new API endpoints. All tests MUST pass before deployment.

### III. User Experience Consistency (Hono & Zod OpenAPI)
API consistency is paramount for developer and end-user experience. All endpoints MUST be documented via `@hono/zod-openapi` to ensure auto-generated documentation remains accurate. Response formats MUST follow a standard structure: success with data, or error with descriptive messages and appropriate HTTP status codes.

### IV. Performance Requirements (Cloudflare Workers)
Code MUST be optimized for the Cloudflare Workers execution environment. This includes minimizing the use of large dependencies to keep the Worker's bundle size small and ensuring that CPU-intensive tasks are performed efficiently to stay within the Worker's limits. Minification and type generation (`npm run cf-gen-types`) ARE REQUIRED for production deployments.

### V. Observability (Logtape)
Every significant state change or external integration call MUST be logged using `@logtape/logtape`. Logs MUST include sufficient context for troubleshooting but MUST NOT include sensitive data like passwords, secrets, or PII.

## Engineering Standards

[SECTION_2_CONTENT]
- **Core Stack**: Hono (Web Framework), Drizzle ORM (Database), Better Auth (Authentication).
- **Database**: Use Drizzle for both schema definition and querying. Raw SQL is only permitted for performance-critical queries that cannot be expressed via the ORM.
- **Security**: Authentication MUST be implemented via Better Auth for all protected routes.

## Development Workflow

[SECTION_3_CONTENT]
- **Prerequisites**: Ensure `npm install` and `npm run cf-gen-types` have been run.
- **Local Dev**: Use `npm run dev` (wrangler dev) for local testing.
- **Deployment**: Deploy via `npm run deploy`, which handles type generation, secret synchronization, and minification.

## Governance

[GOVERNANCE_RULES]
- All PRs must verify compliance with these principles.
- Use the principles to justify design decisions in implementation plans.
- Amendments to this constitution MUST increment the version number and include a Sync Impact Report.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-04-06
