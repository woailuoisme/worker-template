# Schema Layer: drizzle-zod Derivation

## Why It Matters

Deriving Zod schemas from Drizzle table definitions via `drizzle-zod` ensures your API
validation stays in sync with your database schema. Hand-writing Zod schemas that mirror
DB columns leads to drift — a column rename in Drizzle won't break your Zod schema until
runtime.

## Incorrect

```typescript
// ❌ Hand-written schema that duplicates DB column definitions
const insertSchema = z.object({
  title: z.string(),
  type: z.enum(["academic", "sports", "arts"]),
  isPublished: z.boolean(),
  createdAt: z.date(),  // ❌ z.date() doesn't serialize to ISO strings
});
```

**Problems:**
- Schema drifts from DB definition when columns change
- `z.date()` produces `Date` objects, not ISO strings — breaks JSON serialization
- Enum values duplicated instead of derived from the source of truth

## Correct

### DB Schema (Persistence)

```typescript
// src/db/schema/content-schema.ts
export const ACHIEVEMENT_TYPES = ["academic", "sports", "arts"] as const;

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type", { enum: ACHIEVEMENT_TYPES }).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Zod Schema (API Contract)

```typescript
// src/modules/achievements/achievements.schema.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { achievements, ACHIEVEMENT_TYPES } from "@/db/schema/content-schema";

// ALWAYS override timestamps with z.iso.datetime()
export const selectSchema = createSelectSchema(achievements, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const baseInsertSchema = createInsertSchema(achievements, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSchema = baseInsertSchema.extend({
  title: z.string().min(3).max(255),
  type: z.enum(ACHIEVEMENT_TYPES),
  studentIds: z.array(z.string().uuid()).optional(),
});

export const updateSchema = insertSchema.partial();
```

### Query, Param, and Response Schemas

```typescript
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(ACHIEVEMENT_TYPES).optional(),
  search: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid ID") });

export const detailResponseSchema = selectSchema.extend({
  images: z.array(imageSchema),
  students: z.array(studentSchema),
});

export const listResponseSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  items: z.array(detailResponseSchema),
});
```

### Type Exports

```typescript
// ALWAYS infer from Zod, never hand-write
export type InsertAchievement = z.infer<typeof insertSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
```

## Key Rules

1. **Derive, don't duplicate**: `createInsertSchema` / `createSelectSchema` from `drizzle-zod`
2. **Override timestamps**: Always `z.iso.datetime()`, never `z.date()`
3. **Omit server-managed fields**: `.omit({ id: true, createdAt: true, updatedAt: true })`
4. **Extend for API needs**: `.extend()` adds fields not in the DB (e.g., `studentIds`)
5. **Infer types from Zod**: `z.infer<typeof schema>`, never hand-written interfaces

## References

- https://orm.drizzle.team/docs/zod
- https://zod.dev
