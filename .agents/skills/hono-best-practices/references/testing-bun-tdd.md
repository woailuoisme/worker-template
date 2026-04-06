# TDD with Bun Test Runner

## Why It Matters

Tests catch regressions before they reach production. The Bun test runner is fast and
built-in, with native module mocking via `mock.module()`. Following the Red-Green-Refactor
cycle and organizing tests by layer (schema, service, route, integration) keeps the test
suite maintainable.

## Workflow: Red -> Green -> Refactor

1. **Red**: Write a failing test for the behavior you want
2. **Green**: Write the minimum code to make it pass
3. **Refactor**: Clean up while keeping tests green

## Test File Layout

```
src/modules/[name]/__tests__/
  ├── [name].schema.test.ts    # Pure Zod validation (no mocks)
  ├── [name].service.test.ts   # Service + mocked DB
  ├── [name].routes.test.ts    # Routes via app.request() + mocked service
  └── [name].integration.test.ts # Real DB with tx rollback
```

## Route Tests with `app.request()`

Use `app.request()` (not `testClient()`) — `testClient()` requires chained route defs,
this project uses `app.route()`.

```typescript
import { describe, it, expect, mock, afterEach } from "bun:test";

// Mock service BEFORE importing routes
mock.module("../achievements.service", () => ({
  achievementsService: {
    listAll: mock(() => Promise.resolve({
      total: 1, page: 1, limit: 10, totalPages: 1, items: [{ id: "1" }],
    })),
  },
}));

mock.module("@/middlewares/auth.middleware", () => ({
  requireAuth: mock(() => async (c: any, next: any) => {
    c.set("user", { id: "u1", role: "admin", status: "active" });
    await next();
  }),
  requireRole: mock((..._: string[]) => async (_c: any, next: any) => {
    await next();
  }),
}));

import { achievementsRouter } from "../achievements.routes";

describe("GET /achievements", () => {
  afterEach(() => mock.restore());

  it("returns paginated list", async () => {
    const res = await achievementsRouter.request("/");
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
  });
});
```

## Service Tests (Mock DB)

```typescript
import { describe, it, expect, mock, afterEach } from "bun:test";

mock.module("@/db", () => ({
  db: {
    query: { achievements: { findFirst: mock(() => Promise.resolve(null)) } },
    delete: mock(() => ({ where: mock(() => Promise.resolve()) })),
  },
}));

import { achievementsService, AchievementNotFoundError } from "../achievements.service";

describe("achievementsService.delete", () => {
  afterEach(() => mock.restore());
  it("throws when not found", () => {
    expect(achievementsService.delete("missing")).rejects.toThrow(AchievementNotFoundError);
  });
});
```

## Schema Tests (Pure)

```typescript
import { describe, it, expect } from "bun:test";
import { insertSchema, listQuerySchema } from "../achievements.schema";

describe("insertSchema", () => {
  it("rejects short title", () => {
    expect(insertSchema.safeParse({ title: "Ab" }).success).toBe(false);
  });
  it("accepts valid input", () => {
    expect(insertSchema.safeParse({
      title: "Math Olympiad",
      type: "academic",
      level: "national",
      rank: 1,
      academicYearId: "550e8400-e29b-41d4-a716-446655440000",
    }).success).toBe(true);
  });
});

describe("listQuerySchema", () => {
  it("defaults page=1, limit=10", () => {
    const r = listQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(10);
  });
  it("coerces strings", () => {
    expect(listQuerySchema.parse({ page: "3" }).page).toBe(3);
  });
  it("rejects limit>100", () => {
    expect(listQuerySchema.safeParse({ limit: "200" }).success).toBe(false);
  });
});
```

## Integration Tests (Transaction Rollback)

```typescript
import { describe, it, expect } from "bun:test";
import { withTestTransaction } from "@/__tests__/helpers/test-db";
import { achievements } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Achievements DB", () => {
  it("creates and retrieves", async () => {
    await withTestTransaction(async (tx) => {
      const [created] = await tx.insert(achievements).values({
        title: "Test", type: "academic", level: "national", rank: 1, academicYearId: "uuid",
      }).returning();
      const found = await tx.query.achievements.findFirst({
        where: eq(achievements.id, created!.id),
      });
      expect(found!.title).toBe("Test");
    });
  });
});
```

## Shared Helpers

```typescript
// src/__tests__/helpers/mock-auth.ts
export function mockAuthMiddleware(user = { id: "u1", name: "Admin", role: "admin", status: "active" }) {
  mock.module("@/middlewares/auth.middleware", () => ({
    requireAuth: mock(() => async (c: any, next: any) => {
      c.set("user", user);
      await next();
    }),
    requireRole: mock((..._: string[]) => async (_c: any, next: any) => {
      await next();
    }),
  }));
}

// src/__tests__/helpers/test-db.ts
export async function withTestTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  const db = createTestDb();
  let result: T;
  try {
    await db.transaction(async (tx) => {
      result = await fn(tx);
      throw new Error("__ROLLBACK__");
    });
  } catch (e: any) {
    if (e.message !== "__ROLLBACK__") throw e;
  }
  return result!;
}
```

## Running Tests

```bash
bun test                                     # All
bun test src/modules/achievements/__tests__/ # Directory
bun test --filter "service"                  # Pattern
bun test --watch                             # Watch mode
bun test --coverage                          # Coverage
```

## Key Patterns

1. **Mock before import**: `mock.module()` must come before importing the module under test
2. **Restore after each**: `afterEach(() => mock.restore())` prevents test pollution
3. **Use `app.request()`**: Not `testClient()` — works with `app.route()` mounting
4. **Schema tests are pure**: No mocks needed, just `safeParse` assertions
5. **Integration tests roll back**: `withTestTransaction` auto-reverts DB changes

## References

- https://bun.sh/docs/cli/test
- https://bun.sh/docs/test/mocks
