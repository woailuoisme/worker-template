# Handler Layer: Thin HTTP Glue

## Why It Matters

Handlers are the bridge between HTTP and business logic. They should be thin — extract
validated input, call a service, map domain errors to HTTP errors, and return a response.
Any business logic in a handler is a sign it should move to the service layer.

## Incorrect

```typescript
// ❌ Business logic in the handler
export const createHandler = async (c: Context) => {
  const body = await c.req.json();
  // ❌ Validation logic belongs in schema/validator
  if (!body.title || body.title.length < 3) {
    return c.json({ error: "Title too short" }, 400);
  }
  // ❌ DB query belongs in service
  const [created] = await db.insert(achievements).values(body).returning();
  return c.json(created, 201);
};
```

## Correct

```typescript
// src/modules/achievements/achievements.handlers.ts
import type { Context } from "hono";
import type { AppEnv } from "@/factory";
import { achievementsService, AchievementNotFoundError } from "./achievements.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const listHandler = async (
  c: Context<AppEnv, string, { in: { query: ListQuery }; out: { query: ListQuery } }>,
) => {
  const query = c.req.valid("query");
  return c.json(await achievementsService.listAll(query), 200);
};

export const createHandler = async (
  c: Context<AppEnv, string, { in: { json: InsertAchievement }; out: { json: InsertAchievement } }>,
) => {
  const body = c.req.valid("json");
  try {
    const id = await achievementsService.create(body);
    return c.json(await achievementsService.getById(id), 201);
  } catch (e: unknown) {
    if (e instanceof AcademicYearNotFoundError) throw new ValidationError("Invalid academic year");
    throw e;
  }
};
```

## Key Patterns

1. **Use `c.req.valid()`**: Always extract from validated input, never `c.req.json()` directly
2. **Type the context**: Include `{ in: { ... }; out: { ... } }` generic for validated types
3. **Catch domain errors**: Map service-layer errors to `AppError` subclasses
4. **Re-throw unknown errors**: Let the global error handler deal with unexpected exceptions
5. **Keep it thin**: If a handler is more than ~15 lines, logic probably belongs in the service

## References

- https://hono.dev/docs/api/context
- https://hono.dev/docs/api/request
