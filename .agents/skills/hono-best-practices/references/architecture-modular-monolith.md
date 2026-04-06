# Architecture: Modular Monolith

## Why It Matters

A well-organized modular monolith keeps feature code self-contained, enforces clear dependency
direction, and makes it easy to add new modules without touching existing ones. The module
structure directly determines how maintainable the codebase is as it grows.

## Project Structure

```
src/
├── index.ts                # Bun.serve entry + OpenAPI spec endpoints
├── app.ts                  # CORS, error handler, route mounting
├── factory.ts              # createRouter() + AppEnv — SINGLE SOURCE OF TRUTH
├── env.ts                  # t3-env validation
├── auth.ts                 # Better Auth config (social, hooks, RBAC)
├── db/
│   ├── index.ts            # Drizzle client (pg pool)
│   └── schema/             # Domain-split tables
│       ├── auth-schema.ts
│       ├── content-schema.ts
│       ├── shared-enums.ts
│       └── index.ts        # Re-exports all
├── lib/                    # Shared kernel
│   ├── errors.ts           # Stoker-compatible error helpers
│   ├── pagination.ts       # Pagination schemas + helpers
│   ├── openapi.ts          # Schema merging (Hono + Better Auth)
│   └── upload.ts           # File upload
├── middlewares/
│   ├── auth.middleware.ts   # requireAuth(), requireRole()
│   └── error-handler.middleware.ts
├── services/               # Cross-module orchestration
└── modules/                # Feature verticals
    └── [module]/
        ├── [name].schema.ts
        ├── [name].service.ts
        ├── [name].handlers.ts
        ├── [name].routes.ts
        ├── [name].index.ts
        └── __tests__/
```

## Module File Convention

Each module follows a consistent naming pattern with the module name as prefix:

| File | Purpose |
|------|---------|
| `[name].schema.ts` | Zod schemas derived from Drizzle (API contract) |
| `[name].service.ts` | Pure business logic, domain errors |
| `[name].handlers.ts` | Thin HTTP glue |
| `[name].routes.ts` | Route definitions with OpenAPI + auth |
| `[name].index.ts` | Re-exports routers for mounting |
| `__tests__/` | Co-located test directory |

## Admin/Public Route Split

When a module needs both authenticated admin routes and unauthenticated public routes,
split them into separate files:

```
modules/achievements/
├── achievements.routes.ts            # Admin (requireAuth + requireRole)
├── public-achievements.routes.ts     # Public (no auth)
├── achievements.handlers.ts
├── public-achievements.handlers.ts
└── achievements.index.ts             # Exports both routers
```

```typescript
// Mounting in app.ts
api.route("/admin/achievements", achievementsRouter);
api.route("/achievements", publicAchievementsRouter);
```

## Sub-Modules (Complex Domains)

For domains with multiple related resources, nest sub-modules:

```
modules/environmental/
├── oil-collections.{schema,service,handlers,routes,index}.ts
├── waste-collections/
│   └── waste-collections.{schema,service,...}.ts
└── compost-activities/
    └── compost-activities.{schema,service,...}.ts
```

## Import Direction Rules

The import dependency graph is strictly one-directional:

```
Module A  ──NEVER──►  Module B internals
Module A  ──OK─────►  Module B .index.ts (re-exports)
Module A  ──OK─────►  lib/*, db/*, middlewares/*, services/*
```

**Why:** Cross-module imports create hidden coupling. When module A imports module B's
service directly, changes in B's internals can break A. The `.index.ts` boundary forces
each module to declare its public API explicitly.

## References

- https://hono.dev/docs/getting-started/basic
- https://hono.dev/docs/api/routing
