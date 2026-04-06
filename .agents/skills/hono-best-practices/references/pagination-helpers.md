# Pagination

## Why It Matters

Consistent pagination across all list endpoints makes the API predictable for frontend
consumers. Reusable schemas and helpers prevent each module from reinventing pagination with slightly different field names or off-by-one bugs.

## Pagination Schemas

```typescript
// src/lib/pagination.ts
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});
```

## Generic Paginated Response

```typescript
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: paginationMetaSchema,
  });
}
```

## Helpers

```typescript
export function getOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export function calculatePaginationMeta(
  total: number,
  { page, limit }: { page: number; limit: number },
) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
```

## Usage in Services

```typescript
const offset = getOffset(query.page, query.limit);
const [totalResult, items] = await Promise.all([
  db.select({ count: sql<number>`count(*)` }).from(table).where(where),
  db.query.table.findMany({ where, limit: query.limit, offset }),
]);
const meta = calculatePaginationMeta(Number(totalResult[0]?.count ?? 0), query);
return { ...meta, items };
```

## References

- https://hono.dev/docs/api/request#valid
