# Error Handling with Stoker

## Why It Matters

Consistent error responses make APIs predictable for frontend consumers. Stoker provides
the foundation (HTTP status codes, `notFound`, `onError`), and the custom `AppError`
hierarchy adds structured error bodies with codes, timestamps, and request IDs.

## Stoker Overview

[Stoker](https://github.com/w3cj/stoker) provides Hono utilities: HTTP status codes/phrases,
error handler middleware, not-found handler, OpenAPI helpers, and a default validation hook.

## HTTP Status Codes (No Magic Numbers)

```typescript
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

// ✅ Use named constants
return c.json(result, HttpStatusCodes.OK);           // 200
return c.json(result, HttpStatusCodes.CREATED);       // 201
return c.json(result, HttpStatusCodes.NOT_FOUND);     // 404

// ❌ AVOID magic numbers
return c.json(result, 200);
```

## Stoker Middlewares: notFound + onError

```typescript
// src/app.ts
import { createRouter } from "@/factory";
import { cors } from "hono/cors";
import notFound from "stoker/middlewares/not-found";
import onError from "stoker/middlewares/on-error";

const app = createRouter();

app.use("*", cors({ /* ... */ }));
app.notFound(notFound);    // JSON 404: { message: "Not Found - /path" }
app.onError(onError);      // JSON 500: { message, stack? } (stack hidden in production)
```

**Stoker's `onError` handler:**
- Returns `{ message: string, stack?: string }`
- Preserves existing error status codes (e.g., 400, 401, 403, 404)
- Falls back to 500 for unknown errors
- Hides stack trace when `NODE_ENV=production`

**Stoker's `notFound` handler:**
- Returns `{ message: "Not Found - /requested/path" }` with 404 status

## Custom Error Handler (Extending Stoker)

When you need richer error responses (timestamps, requestId, etc.), extend Stoker's pattern:

```typescript
// src/middlewares/error-handler.middleware.ts
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";
import { AppError, ValidationError, type ErrorResponse } from "@/lib/errors";

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const env = c.env?.NODE_ENV || process.env?.NODE_ENV;

  if (env === "development") {
    console.error("Error:", { requestId, message: err.message, stack: err.stack });
  }

  // 1. AppError (custom hierarchy)
  if (err instanceof AppError) {
    return c.json<ErrorResponse>({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp,
        requestId,
      },
    }, err.statusCode as ContentfulStatusCode);
  }

  // 2. Zod validation errors
  if (err instanceof z.ZodError) {
    const ve = ValidationError.fromZod(err);
    return c.json<ErrorResponse>({
      success: false,
      error: { code: ve.code, message: ve.message, details: ve.details, timestamp, requestId },
    }, HttpStatusCodes.BAD_REQUEST as ContentfulStatusCode);
  }

  // 3. Unknown -> safe 500
  return c.json<ErrorResponse>({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      ...(env === "development" && { details: { originalError: err.message } }),
      timestamp,
      requestId,
    },
  }, HttpStatusCodes.INTERNAL_SERVER_ERROR as ContentfulStatusCode);
};
```

## AppError Hierarchy

```typescript
// src/lib/errors.ts
import * as HttpStatusCodes from "stoker/http-status-codes";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", details?: Record<string, unknown>) {
    super(HttpStatusCodes.BAD_REQUEST, "VALIDATION_ERROR", message, details);
  }
  static fromZod(err: z.ZodError) {
    return new ValidationError("Validation failed", {
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(HttpStatusCodes.NOT_FOUND, "NOT_FOUND", `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(HttpStatusCodes.UNAUTHORIZED, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permission denied") {
    super(HttpStatusCodes.FORBIDDEN, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(HttpStatusCodes.CONFLICT, "CONFLICT", message);
  }
}
```

## Shared Error Response Schema (for OpenAPI)

```typescript
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
  }),
});
```

## Stoker OpenAPI Helpers

```typescript
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createMessageObjectSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

// Shorthand for response definitions
const responses = {
  [HttpStatusCodes.OK]: jsonContent(detailResponseSchema, "Achievement detail"),
  [HttpStatusCodes.NOT_FOUND]: jsonContent(errorResponseSchema, "Not found"),
};

// Shorthand for request body
const body = jsonContentRequired(insertSchema, "Achievement to create");

// Predefined UUID param schema (saves defining idParamSchema manually)
// IdUUIDParamsSchema = z.object({ id: z.string().uuid() })

// Standard message response
// createMessageObjectSchema("Deleted") -> z.object({ message: z.literal("Deleted") })
```

## Error Flow Summary

```
Service throws domain error
  -> Handler catches + maps to AppError
    -> Global errorHandler formats { success, error: { code, message, timestamp, requestId } }

Zod validation fails
  -> hono-openapi validator rejects
    -> errorHandler catches ZodError -> ValidationError response

Route not found
  -> Stoker notFound -> { message: "Not Found - /path" }
```

## References

- https://github.com/w3cj/stoker
- https://hono.dev/docs/api/exception
