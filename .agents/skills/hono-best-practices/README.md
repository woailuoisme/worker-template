# Hono Best Practices

AI-agent-ready best practices for [Hono](https://hono.dev/) v4+ backends with Bun, Drizzle ORM, Better Auth, Stoker, hono-openapi + Zod + Scalar, and TDD with Bun test runner. Designed to be consumed by LLM-based coding agents (Claude, Cursor, Codex, etc.) as a skill or context file so they write correct, idiomatic Hono code out of the box.

Inspired by [honra-io/drizzle-best-practices](https://github.com/honra-io/drizzle-best-practices).

## What's Inside

The skill is organized into 11 priority-ranked categories, each with a dedicated reference file containing explanations, correct vs incorrect code examples, and links to official docs.

### Current Coverage

| Category | Reference | What's Covered |
|----------|-----------|----------------|
| **Architecture & Modules** | `architecture-modular-monolith.md` | Modular monolith structure, module file convention, admin/public route splits, sub-modules, import direction rules, cross-module communication |
| **Factory & Types** | `factory-types.md` | `createRouter()`, `AppBindings`, `AppVariables`, `AppEnv`, `AppContext`, `createFactory` usage |
| **Schema (drizzle-zod)** | `schema-drizzle-zod.md` | `createInsertSchema`/`createSelectSchema`, `.omit()`, `.extend()`, ISO datetime overrides, query/param/response schemas, type inference from Zod |
| **Service Layer** | `service-pure-logic.md` | Pure business logic services, domain error classes, transaction handling, parallel queries with `Promise.all` |
| **Handler Layer** | `handler-http-glue.md` | Thin HTTP glue, `c.req.valid()` typed extraction, domain-to-HTTP error mapping |
| **Routes & OpenAPI** | `routes-hono-openapi.md` | `describeRoute`, `resolver`, `validator`, middleware chain order, route definition patterns with Stoker status codes |
| **Error Handling** | `error-stoker-apperror.md` | Stoker `notFound`/`onError`, custom `AppError` hierarchy (`ValidationError`, `NotFoundError`, `ForbiddenError`, etc.), `errorResponseSchema`, error flow summary |
| **OpenAPI & Scalar** | `openapi-scalar-spec.md` | `openAPIRouteHandler`, `securitySchemes`, `.meta()` (Zod v4), Scalar UI themes, spec merging with Better Auth via `openapi-merge` |
| **Better Auth** | `auth-better-auth.md` | Core setup with Drizzle adapter, Google OAuth, account linking, custom user fields, admin plugin, fine-grained RBAC with `createAccessControl`, session management, database hooks, auth middleware, app mounting |
| **Pagination** | `pagination-helpers.md` | `paginationQuerySchema`, `paginationMetaSchema`, `createPaginatedResponseSchema`, offset calculation, meta helpers |
| **Testing** | `testing-bun-tdd.md` | Red-green-refactor with Bun test runner, `app.request()` route tests, `mock.module()` patterns, service tests with mocked DB, pure schema tests, integration tests with transaction rollback, shared test helpers |

### Stack

| Package | Role |
|---------|------|
| [Hono](https://hono.dev/) | Web framework |
| [Bun](https://bun.sh/) | Runtime, test runner, package manager |
| [Drizzle ORM](https://orm.drizzle.team/) | Database ORM (PostgreSQL) |
| [drizzle-zod](https://orm.drizzle.team/docs/zod) | Schema derivation (Drizzle → Zod) |
| [Better Auth](https://www.better-auth.com/) | Authentication, sessions, RBAC |
| [Stoker](https://github.com/w3cj/stoker) | HTTP status codes, error handlers, OpenAPI helpers |
| [hono-openapi](https://github.com/rhinobase/hono-openapi) | Route documentation + validation |
| [Zod](https://zod.dev/) | Runtime validation |
| [@scalar/hono-api-reference](https://github.com/scalar/scalar) | Interactive API docs UI |

## How It Works

This repository follows the agent-skills pattern. AI agents read `SKILL.md` for top-level instructions (golden rules, anti-patterns, checklist, imports) and then load individual `references/*.md` files on-demand based on what the user is working on.

```
hono-best-practices/
├── README.md                                # This file (for humans)
├── SKILL.md                                 # Main skill file (for AI agents)
└── references/
    ├── _sections.md                         # Full index of all reference files
    ├── architecture-modular-monolith.md     # Project structure + module patterns
    ├── factory-types.md                     # Factory pattern + AppEnv types
    ├── schema-drizzle-zod.md                # drizzle-zod derivation
    ├── service-pure-logic.md                # Pure business logic services
    ├── handler-http-glue.md                 # Thin HTTP handler layer
    ├── routes-hono-openapi.md               # Route definitions + OpenAPI
    ├── error-stoker-apperror.md             # Stoker + AppError hierarchy
    ├── openapi-scalar-spec.md               # Spec generation + Scalar UI
    ├── auth-better-auth.md                  # Auth, social, RBAC, hooks
    ├── pagination-helpers.md                # Pagination schemas + helpers
    └── testing-bun-tdd.md                   # TDD with Bun test runner
```

## Contributing

### Adding a New Reference

1. Create a new `.md` file in `references/` with the appropriate category prefix
2. Follow the existing format: "Why It Matters" → "Incorrect" → "Correct" → "Key Patterns" → "References"
3. Add the file to `references/_sections.md`
4. Update the file listing in `SKILL.md` under "How to Use"

### Style Guide

- Every reference file should explain **why** a pattern matters, not just what to do
- Include both incorrect and correct code examples with explanations
- Keep code examples minimal and focused — don't add boilerplate that distracts from the point
- Link to official documentation at the bottom of each reference
