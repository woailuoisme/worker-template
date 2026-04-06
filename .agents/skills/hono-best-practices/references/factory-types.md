# Factory Pattern

## Why It Matters

The factory pattern ensures every router in the app shares the same type-safe environment
bindings. Without it, you end up with `new Hono()` scattered everywhere, each missing the
`Bindings` and `Variables` types — leading to `c.env` and `c.get()` being untyped.

## Incorrect

```typescript
// ❌ Raw Hono constructor — no shared types
import { Hono } from "hono";

const router = new Hono();

router.get("/", (c) => {
  const db = c.env.DATABASE_URL; // ❌ Type error: env is unknown
  const user = c.get("user");    // ❌ Type error: variable not declared
  return c.json({ ok: true });
});
```

**Problems:**
- No type safety on `c.env` or `c.get()`
- Each router defines its own (or no) type environment
- Middleware that sets variables has no type contract with handlers

## Correct

```typescript
// src/factory.ts
import { createFactory } from "hono/factory";
import { Hono, type Context } from "hono";

export type AppBindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  CORS_ALLOWED_ORIGINS: readonly string[];
};

export type AppVariables = {
  user?: AuthUser;
  session?: AuthSession;
  requestId?: string;
};

export type AppEnv = { Bindings: AppBindings; Variables: AppVariables };

export const factory = createFactory<AppEnv>();
export const createRouter = (): Hono<AppEnv> => new Hono<AppEnv>();
export type AppContext = Context<AppEnv>;
```

**Why this is better:**
- Single source of truth for environment types
- Every router created via `createRouter()` inherits full type safety
- `c.env.DATABASE_URL` and `c.get("user")` are correctly typed everywhere
- Middleware authored via `factory.createMiddleware()` shares the same types

## Usage

```typescript
// In any module's routes file:
import { createRouter } from "@/factory";

const router = createRouter(); // ✅ Fully typed
```

## Notes

- `createFactory` is from `hono/factory` — it produces typed middleware factories
- `createRouter` is a thin wrapper that ensures `new Hono<AppEnv>()` is never written directly
- Add new env vars or context variables to `AppBindings` / `AppVariables` as the app grows

## References

- https://hono.dev/docs/helpers/factory
- https://hono.dev/docs/api/context
