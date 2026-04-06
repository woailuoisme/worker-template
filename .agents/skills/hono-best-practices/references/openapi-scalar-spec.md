# OpenAPI + Zod + Scalar Integration

## Why It Matters

Having auto-generated, always-accurate API docs eliminates the classic problem of docs
drifting from implementation. The `hono-openapi` + `zod` + `@scalar/hono-api-reference`
stack makes this seamless — schemas defined once serve as both runtime validation and
documentation source.

## Stack Overview

| Package | Role |
|---------|------|
| `hono-openapi` | `describeRoute()`, `resolver()`, `validator()`, `openAPIRouteHandler()` |
| `zod` + `zod-openapi` | Schema validation + OpenAPI metadata extension |
| `@scalar/hono-api-reference` | Interactive API docs UI |
| `stoker` | OpenAPI helpers, HTTP status codes, error schemas |
| `openapi-merge` | Merge Hono + Better Auth OpenAPI specs |

## Generating & Serving the OpenAPI Spec

**Define `securitySchemes` in the spec** — routes reference `security: [{ bearerAuth: [] }]`
but the scheme must be declared in `components`:

```typescript
// src/index.ts
import { openAPIRouteHandler } from "hono-openapi";
import { app } from "./app";

app.get("/openapi.json", openAPIRouteHandler(app, {
  documentation: {
    openapi: "3.0.0",
    info: { title: "SDN Joglo 05 API", version: "1.0.0" },
    tags: [
      { name: "News (Admin)", description: "Admin news management" },
      { name: "News (Public)", description: "Public news endpoints" },
      { name: "Achievements (Admin)", description: "Admin achievement management" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Better Auth bearer token",
        },
        apiKeyCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Session cookie from Better Auth",
        },
      },
    },
  },
  excludeMethods: ["OPTIONS", "HEAD"],
}));
```

## Enriching Schemas with OpenAPI Metadata

`hono-openapi` uses plain Zod schemas by default — `resolver()` converts them to JSON Schema
automatically. But for richer specs (examples, descriptions, named `$ref` components), you
need to add OpenAPI metadata to your schemas. There are two approaches depending on your
Zod version.

### Approach 1: `zod-openapi/extend` (Zod v3 and v4)

The `zod-openapi` package adds an `.openapi()` method to all Zod schemas. This is the same
mechanism that `@hono/zod-openapi` uses internally — `hono-openapi` supports it because
`resolver()` understands the extended schemas.

```typescript
// Import ONCE at app entry point (side-effect import)
import "zod-openapi/extend";
import { z } from "zod";

// Field-level metadata (descriptions, examples)
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    description: "Page number",
    example: 1,
  }),
  limit: z.coerce.number().int().min(1).max(100).default(10).openapi({
    description: "Items per page (max 100)",
    example: 10,
  }),
  search: z.string().optional().openapi({
    description: "Search by title",
    example: "olympiad",
  }),
});

// Named component registration -> becomes $ref: "#/components/schemas/Achievement"
export const achievementSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  title: z.string().openapi({ example: "Math Olympiad Winner" }),
  type: z.enum(ACHIEVEMENT_TYPES),
}).openapi("Achievement");
```

**What `.openapi()` supports:**

```typescript
z.string().openapi({
  description: "Human-readable description",
  example: "example value",
  deprecated: true,
  default: "fallback",
  format: "email",           // OpenAPI format hint
  externalDocs: { url: "https://..." },
});

// Register as named component (top-level .openapi() with string)
z.object({ ... }).openapi("SchemaName");
```

### Approach 2: `.meta()` (Zod v4 only)

Zod v4 has a built-in `.meta()` method. This works without any extra imports, but is less
feature-rich — it passes arbitrary metadata that `resolver()` will include if it recognizes
the keys.

```typescript
import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).meta({
    description: "Page number",
    example: 1,
  }),
  search: z.string().optional().meta({
    description: "Search by title",
    example: "olympiad",
  }),
});

// Named component via meta id
export const achievementSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.enum(ACHIEVEMENT_TYPES),
}).meta({ id: "Achievement" }); // Creates $ref: "#/components/schemas/Achievement"
```

### Which to use?

| | `zod-openapi/extend` | `.meta()` |
|---|---|---|
| **Zod version** | v3 and v4 | v4 only |
| **Extra dependency** | Needs `zod-openapi` package | Built into Zod |
| **Feature coverage** | Full OpenAPI metadata (`deprecated`, `format`, `externalDocs`, etc.) | Basic (`description`, `example`, `id`) |
| **Named components** | `.openapi("Name")` — explicit, clear | `.meta({ id: "Name" })` — works but less obvious |
| **Recommendation** | Use for production APIs that need rich specs | Use for quick prototypes or minimal metadata |

For production projects, prefer `zod-openapi/extend` — it gives you the full OpenAPI metadata
vocabulary while keeping the middleware-based route pattern that makes `hono-openapi` simpler
than `@hono/zod-openapi`.

### Without any metadata

If you don't need examples or descriptions, plain Zod schemas work fine. `resolver()` converts
them to JSON Schema automatically — you just won't get the extra metadata in your spec:

```typescript
// This still generates a valid OpenAPI spec, just without examples/descriptions
const schema = z.object({ name: z.string(), age: z.number() });
// resolver(schema) -> { type: "object", properties: { name: { type: "string" }, ... } }
```

## Scalar API Reference UI

```typescript
// src/app.ts
api.get(
  "/docs",
  Scalar({
    pageTitle: "SDN Joglo 05 API Docs",
    theme: "kepler",
    sources: [
      { url: "/openapi.json", title: "API" },
      { url: "/api/auth/open-api/generate-schema", title: "Auth" },
    ],
  }),
);
```

**Scalar configuration options:**
```typescript
Scalar({
  pageTitle: string,
  theme: "kepler" | "saturn" | "mars" | "default" | "alternate" | "moon",
  sources: Array<{ url: string; title: string }>,
  // Multiple sources allow merging Hono + Better Auth schemas
})
```

## Merging Hono + Better Auth OpenAPI Specs

```typescript
// src/lib/openapi.ts
import { merge, isErrorResult } from "openapi-merge";

export async function mergeOpenAPISchemas({ honoSchema, authSchema, serverUrl }) {
  const mergeResult = merge([
    { oas: honoSchema },
    { oas: addPathPrefix(authSchema, "/api/auth") },
  ]);

  if (isErrorResult(mergeResult)) throw new Error(`Merge failed: ${mergeResult.message}`);

  return { ...mergeResult.output, servers: [{ url: serverUrl }] };
}

// Endpoint: /openapi-merged.json (cached in production)
app.get("/openapi-merged.json", async (c) => {
  const honoSpec = await (await app.request("/openapi.json")).json();
  const authSpec = await auth.api.generateOpenAPISchema();
  const merged = await mergeOpenAPISchemas({
    honoSchema: honoSpec,
    authSchema: authSpec,
    serverUrl: env.BETTER_AUTH_URL,
  });
  return c.json(merged);
});
```

## References

- https://github.com/rhinobase/hono-openapi
- https://github.com/scalar/scalar
- https://www.npmjs.com/package/openapi-merge
