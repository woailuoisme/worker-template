# Routes Layer: hono-openapi + Validation

## Why It Matters

Route definitions wire together OpenAPI documentation, input validation, authentication,
and handlers. Using `describeRoute` + `validator` from `hono-openapi` means your API docs
are always in sync with the actual validation — no more outdated Swagger files.

## Middleware Chain Order

The order matters because each middleware depends on what came before:

```
describeRoute() -> requireAuth() -> requireRole() -> validator() -> handler
```

1. `describeRoute` — declares the OpenAPI spec (no runtime effect)
2. `requireAuth` — verifies the session, sets `c.get("user")`
3. `requireRole` — checks `user.role` (depends on `requireAuth` running first)
4. `validator` — validates input against Zod schemas
5. `handler` — processes the request

## Incorrect

```typescript
// ❌ Missing OpenAPI, wrong middleware order
router.get("/", requireAuth(), handlers.listHandler);
```

## Correct

```typescript
// src/modules/achievements/achievements.routes.ts
import { createRouter } from "@/factory";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as handlers from "./achievements.handlers";
import * as s from "./achievements.schema";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { errorResponseSchema } from "@/lib/errors";
import * as HttpStatusCodes from "stoker/http-status-codes";

const router = createRouter();

router.get(
  "/",
  describeRoute({
    tags: ["Achievements (Admin)"],
    summary: "List achievements",
    operationId: "listAchievements",
    security: [{ bearerAuth: [] }],
    responses: {
      [HttpStatusCodes.OK]: {
        description: "Success",
        content: { "application/json": { schema: resolver(s.listResponseSchema) } },
      },
      [HttpStatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(errorResponseSchema) } },
      },
    },
  }),
  requireAuth(),
  requireRole("admin", "principal"),
  validator("query", s.listQuerySchema),
  handlers.listHandler,
);

router.post(
  "/",
  describeRoute({
    tags: ["Achievements (Admin)"],
    summary: "Create achievement",
    operationId: "createAchievement",
    security: [{ bearerAuth: [] }],
    responses: {
      [HttpStatusCodes.CREATED]: {
        description: "Created",
        content: { "application/json": { schema: resolver(s.detailResponseSchema) } },
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        description: "Validation error",
        content: { "application/json": { schema: resolver(errorResponseSchema) } },
      },
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: {
        description: "Validation failed",
        content: { "application/json": { schema: resolver(errorResponseSchema) } },
      },
    },
  }),
  requireAuth(),
  requireRole("admin", "principal"),
  validator("json", s.insertSchema),
  handlers.createHandler,
);

export { router as achievementsRouter };
```

## Key Patterns

1. **Every route gets `describeRoute`**: Documents tags, summary, operationId, security, responses
2. **Use `resolver()` for response schemas**: Converts Zod schemas to OpenAPI JSON Schema
3. **Use `validator()` for input**: Validates query, json, param, or header against Zod schemas
4. **Named status codes**: Always `HttpStatusCodes.OK`, never `200`
5. **Include error responses**: Document 400, 401, 403, 404 responses in OpenAPI spec
6. **Export with descriptive alias**: `export { router as achievementsRouter }`

## References

- https://github.com/rhinobase/hono-openapi
- https://github.com/w3cj/stoker
- https://hono.dev/docs/api/routing
