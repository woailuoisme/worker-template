# Better Auth: First-Class Integration

## Why It Matters

Better Auth handles authentication, social sign-on, session management, and RBAC as a
first-class Hono integration. Understanding its configuration patterns, hook semantics,
and admin plugin prevents common pitfalls like missing session checks, broken OAuth flows,
or overly permissive role assignments.

## Core Setup with Hono + Drizzle

```typescript
// src/auth.ts
import { betterAuth, APIError } from "better-auth";
import { openAPI, bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",

  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: env.CORS_ALLOWED_ORIGINS,
  plugins: [openAPI(), bearer()],

  advanced: { database: { generateId: "uuid" } },
  rateLimit: { window: 10, max: 100 },
});
```

## Social Sign-On (Google OAuth)

```typescript
socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    // Callback auto-registered at: /api/auth/callback/google
  },
},

account: {
  accountLinking: {
    enabled: true,              // Link OAuth to existing email accounts
    ensureEmailVerified: true,  // Only link verified emails
  },
},
```

**Frontend redirect:**
```typescript
window.location.href = `${API_URL}/api/auth/sign-in/social?provider=google&callbackURL=${FRONTEND_URL}/dashboard`;
```

**Adding more providers:**
```typescript
socialProviders: {
  google: { clientId: "...", clientSecret: "..." },
  github: { clientId: "...", clientSecret: "..." },
},
```

## Custom User Fields & Roles

```typescript
user: {
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "school_personnel",
      input: false,  // Cannot be set by user during signup
    },
    status: {
      type: "string",  // "pending" | "active" | "suspended"
      required: true,
      defaultValue: "pending",
      input: false,
    },
    nip: { type: "string", required: false, input: true },
    nuptk: { type: "string", required: false, input: true },
    position: { type: "string", required: false, input: true },
    approvalStatus: {
      type: "string",  // "PENDING" | "APPROVED" | "REJECTED"
      required: false,
      defaultValue: "PENDING",
      input: false,
    },
  },
},
```

## Admin Plugin for RBAC

```typescript
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    openAPI(),
    bearer(),
    admin({
      defaultRole: "school_personnel",
      adminRoles: ["admin", "principal"],
      defaultBanReason: "Policy violation",
      bannedUserMessage: "Your account has been suspended",
    }),
  ],
});
```

**Admin plugin adds to schema:** `user.role`, `user.banned`, `user.banReason`, `user.banExpires`, `session.impersonatedBy`

**All 13 admin API endpoints:**

| Endpoint | Method | Body/Query |
|----------|--------|------------|
| `/admin/set-role` | POST | `{ userId, role }` |
| `/admin/list-users` | GET | `?searchValue&searchField&limit&offset&sortBy&sortDirection&filterField&filterValue` |
| `/admin/get-user` | GET | `?id` |
| `/admin/create-user` | POST | `{ email, name, password?, role?, data? }` |
| `/admin/update-user` | POST | `{ userId, data }` |
| `/admin/ban-user` | POST | `{ userId, banReason?, banExpiresIn? }` |
| `/admin/unban-user` | POST | `{ userId }` |
| `/admin/remove-user` | POST | `{ userId }` |
| `/admin/set-user-password` | POST | `{ userId, newPassword }` |
| `/admin/impersonate-user` | POST | `{ userId }` |
| `/admin/stop-impersonating` | POST | -- |
| `/admin/revoke-user-session` | POST | `{ sessionToken }` |
| `/admin/revoke-user-sessions` | POST | `{ userId }` |

## Fine-Grained Access Control (RBAC)

```typescript
import { createAccessControl, role } from "better-auth/plugins/access";
import { admin } from "better-auth/plugins";

// 1. Define resource -> action statements
const ac = createAccessControl({
  user: ["create", "list", "set-role", "ban", "delete", "get", "update"],
  session: ["list", "revoke", "delete"],
  news: ["create", "read", "update", "delete", "publish"],
  achievement: ["create", "read", "update", "delete"],
  dailyActivity: ["create", "read", "update", "delete"],
} as const);

// 2. Define roles with permissions
const adminRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "delete", "get", "update"],
  session: ["list", "revoke"],
  news: ["create", "read", "update", "delete", "publish"],
  achievement: ["create", "read", "update", "delete"],
  dailyActivity: ["create", "read", "update", "delete"],
});

const principalRole = ac.newRole({
  user: ["list", "get", "set-role", "ban"],
  news: ["create", "read", "update", "publish"],
  achievement: ["create", "read", "update", "delete"],
});

const personnelRole = ac.newRole({
  news: ["create", "read", "update"],
  dailyActivity: ["create", "read", "update"],
});

// 3. Wire into admin plugin
export const auth = betterAuth({
  plugins: [
    admin({
      ac,
      roles: { admin: adminRole, principal: principalRole, school_personnel: personnelRole },
      defaultRole: "school_personnel",
      adminRoles: ["admin", "principal"],
    }),
  ],
});

// 4. Check permissions in handlers
export const publishNewsHandler = async (c: AppContext) => {
  const user = c.get("user")!;
  const hasPermission = await auth.api.userHasPermission({
    body: { userId: user.id, permissions: { news: ["publish"] } },
  });
  if (!hasPermission.success) throw new ForbiddenError("Cannot publish news");
};
```

**Using admin API in handlers:**
```typescript
export const approveUserHandler = async (c: AppContext) => {
  const { userId } = c.req.valid("param");
  await auth.api.setRole({ body: { userId, role: "school_personnel" } });
  await db.update(user).set({ status: "active", approvalStatus: "APPROVED" }).where(eq(user.id, userId));
  return c.json({ success: true }, HttpStatusCodes.OK);
};
```

## Session Management

```typescript
session: {
  expiresIn: 60 * 60,    // 1 hour
  updateAge: 60 * 5,      // Refresh every 5 minutes
},

emailAndPassword: {
  enabled: true,
  autoSignIn: false,
  password: {
    hash: async (pw) => await Bun.password.hash(pw),
    verify: async ({ password, hash }) => await Bun.password.verify(password, hash),
  },
},
```

## Database Hooks (User Lifecycle)

**Hook return semantics:**

| Return | Effect |
|--------|--------|
| `void` | Proceed normally |
| `false` | Cancel operation silently |
| `{ data: modified }` | Replace data being written (before create/update only) |
| `throw new APIError(...)` | Cancel with error response |

Hooks available on: `user`, `session`, `account`, `verification` — each with `create`, `update`, `delete` x `before`/`after`.

```typescript
databaseHooks: {
  session: {
    create: {
      before: async (session) => {
        const foundUser = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, session.userId),
          with: { accounts: true },
        });

        if (!foundUser || foundUser.role === "principal") return;

        // Block suspended users
        if (foundUser.status === "suspended") {
          throw new APIError("FORBIDDEN", { message: "ACCOUNT_SUSPENDED" });
        }

        // Force OAuth profile completion
        const oauthAccount = foundUser.accounts.find((a) => a.providerId !== "credential");
        if (oauthAccount && (!foundUser.nuptk || !foundUser.position)) {
          const token = await createOAuthProfileToken({ /* user data */ });
          throw new APIError("FORBIDDEN", { message: `COMPLETE_YOUR_PROFILE:${token}` });
        }

        // Require admin approval
        if (foundUser.approvalStatus !== "APPROVED" || foundUser.status !== "active") {
          throw new APIError("FORBIDDEN", {
            message: "YOUR_ACCOUNT_IS_CURRENTLY_PENDING_APPROVAL_FROM_THE_ADMINISTRATOR",
          });
        }
      },
    },
  },
},
```

## Auth Middleware

```typescript
// src/middlewares/auth.middleware.ts
import { auth } from "@/auth";
import { factory } from "@/factory";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

export const requireAuth = (options = { allowPending: false }) => {
  return factory.createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) throw new UnauthorizedError();

    const user = authUserSchema.parse(session.user);
    if (user.status === "suspended") throw new ForbiddenError("Account suspended");
    if (user.status === "pending" && !options.allowPending) throw new ForbiddenError("Account not active");

    c.set("user", user);
    c.set("session", session.session);
    await next();
  });
};

export const requireRole = (...roles: UserRole[]) => {
  return factory.createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user) throw new UnauthorizedError();
    if (!roles.includes(user.role)) throw new ForbiddenError("Insufficient permissions");
    await next();
  });
};
```

## Mounting Auth in App

```typescript
// src/app.ts
const authRouter = createRouter();

authRouter.route("/", oauthProfileRouter);

// NIP/NUPTK login interceptor
authRouter.post("/sign-in/email", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (typeof body?.email === "string" && /^\d+$/.test(body.email)) {
    // Resolve numeric ID -> email, forward to Better Auth
  }
  return auth.handler(c.req.raw);
});

// Better Auth catch-all
authRouter.all("/*", async (c) => auth.handler(c.req.raw));

api.route("/auth", authRouter);
```

## References

- https://www.better-auth.com/docs
- https://www.better-auth.com/docs/plugins/admin
- https://www.better-auth.com/docs/plugins/access
- https://www.better-auth.com/docs/concepts/database-hooks
