# Service Layer: Pure Business Logic

## Why It Matters

Services contain the core business logic. Keeping them free of HTTP concepts (`Context`,
status codes, headers) makes them testable in isolation and reusable from background jobs,
CLI scripts, or other services.

## Incorrect

```typescript
// ❌ Service that depends on Hono Context
import type { Context } from "hono";

export const achievementsService = {
  delete: async (c: Context) => {
    const id = c.req.param("id");  // ❌ HTTP extraction in service
    const existing = await db.query.achievements.findFirst({ where: eq(achievements.id, id) });
    if (!existing) {
      return c.json({ error: "Not found" }, 404);  // ❌ HTTP response in service
    }
    await db.delete(achievements).where(eq(achievements.id, id));
    return c.json({ success: true }, 200);
  },
};
```

**Problems:**
- Cannot call this service from a CLI script or background job
- Cannot unit test without mocking the entire Hono Context
- Business logic mixed with HTTP response formatting

## Correct

```typescript
// src/modules/achievements/achievements.service.ts
import { db } from "@/db";
import { achievements } from "@/db/schema/content-schema";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

// Domain errors (NOT HTTP errors)
export class AchievementNotFoundError extends Error {
  constructor() { super("Achievement not found"); this.name = "AchievementNotFoundError"; }
}

export const achievementsService = {
  listAll: async (query: ListQuery) => {
    const { page, limit, type, search } = query;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (type) conditions.push(eq(achievements.type, type));
    if (search) conditions.push(ilike(achievements.title, `%${search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, results] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(achievements).where(where),
      db.query.achievements.findMany({
        where,
        with: { images: true },
        limit,
        offset,
        orderBy: [desc(achievements.createdAt)],
      }),
    ]);

    return {
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult[0]?.count ?? 0) / limit),
      items: results,
    };
  },

  getById: async (id: string) => {
    const result = await db.query.achievements.findFirst({
      where: eq(achievements.id, id),
      with: { images: true },
    });
    return result ?? null;
  },

  create: async (data: InsertAchievement) => {
    const { studentIds, ...achievementData } = data;
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(achievements).values(achievementData).returning();
      return created.id;
    });
  },

  delete: async (id: string) => {
    const existing = await db.query.achievements.findFirst({
      where: eq(achievements.id, id),
    });
    if (!existing) throw new AchievementNotFoundError();
    await db.delete(achievements).where(eq(achievements.id, id));
    return { success: true, message: "Deleted" };
  },
};
```

## Key Patterns

1. **Primitives only**: Services accept `string`, `number`, typed DTOs — never `Context`
2. **Domain errors**: Throw named error classes (`AchievementNotFoundError`), not HTTP errors
3. **Parallel queries**: Use `Promise.all` for independent queries (count + data)
4. **Transactions**: Use `db.transaction()` when multiple writes must be atomic
5. **Return data**: Return results, let handlers decide the HTTP response shape

## References

- https://orm.drizzle.team/docs/rqb
- https://orm.drizzle.team/docs/transactions
