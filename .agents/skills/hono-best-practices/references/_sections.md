# Reference Sections

This file lists all reference files organized by category and priority.

## 1. Architecture & Modules (CRITICAL)

Project structure, module organization, and import rules that keep the codebase maintainable.

| File | Topic |
|------|-------|
| `architecture-modular-monolith.md` | Modular monolith structure, module patterns, admin/public splits, sub-modules, cross-module communication |

## 2. Factory & Types (CRITICAL)

The factory pattern that enforces type-safe routing across the entire app.

| File | Topic |
|------|-------|
| `factory-types.md` | `createRouter()`, `AppBindings`, `AppVariables`, `AppEnv`, `AppContext` |

## 3. Schema Layer (CRITICAL)

Deriving Zod API schemas from Drizzle table definitions via `drizzle-zod`.

| File | Topic |
|------|-------|
| `schema-drizzle-zod.md` | `createInsertSchema`/`createSelectSchema`, `.omit()`, `.extend()`, query/param/response schemas, type inference |

## 4. Service Layer (HIGH)

Pure business logic that never touches HTTP concepts.

| File | Topic |
|------|-------|
| `service-pure-logic.md` | Service pattern, domain errors, transaction handling, `Promise.all` for parallel queries |

## 5. Handler Layer (HIGH)

Thin HTTP glue between routes and services.

| File | Topic |
|------|-------|
| `handler-http-glue.md` | Handler typing, `c.req.valid()`, domain-to-HTTP error mapping |

## 6. Routes & OpenAPI (HIGH)

Route definitions with hono-openapi validation and documentation.

| File | Topic |
|------|-------|
| `routes-hono-openapi.md` | `describeRoute`, `resolver`, `validator`, middleware chain order, route definition patterns |

## 7. Error Handling (HIGH)

Stoker integration and custom error hierarchy.

| File | Topic |
|------|-------|
| `error-stoker-apperror.md` | Stoker `notFound`/`onError`, `AppError` hierarchy, `ValidationError.fromZod()`, error flow, `errorResponseSchema` |

## 8. OpenAPI & Scalar (MEDIUM)

OpenAPI spec generation, schema metadata, and interactive API docs.

| File | Topic |
|------|-------|
| `openapi-scalar-spec.md` | `openAPIRouteHandler`, `securitySchemes`, `.meta()` (Zod v4), Scalar UI, spec merging with Better Auth |

## 9. Better Auth (MEDIUM)

Authentication, authorization, social sign-on, RBAC, hooks, and middleware.

| File | Topic |
|------|-------|
| `auth-better-auth.md` | Core setup, Google OAuth, custom fields, admin plugin, RBAC with `createAccessControl`, session management, database hooks, auth middleware, app mounting |

## 10. Pagination (MEDIUM)

Reusable pagination schemas and helpers.

| File | Topic |
|------|-------|
| `pagination-helpers.md` | `paginationQuerySchema`, `paginationMetaSchema`, `createPaginatedResponseSchema`, offset/meta helpers |

## 11. Testing (MEDIUM)

TDD with Bun test runner, mocking patterns, and integration tests.

| File | Topic |
|------|-------|
| `testing-bun-tdd.md` | Red-green-refactor, `app.request()` route tests, `mock.module()`, service tests, schema tests, integration tests with transaction rollback, shared helpers |
