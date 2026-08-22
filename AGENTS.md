<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Next.js 15 Architecture Rules

## Architecture Philosophy

This project follows:

- Feature Driven Architecture
- Use Case Driven Business Logic
- App Router First
- Server Components First
- Clean Architecture Principles
- 1 File = 1 Responsibility

Goals:

- scalable
- maintainable
- testable
- predictable
- AI-friendly

Architecture consistency is mandatory.

---

# Core Principles

## 1 File = 1 Responsibility

Every file should have a single purpose.

Examples:

- One use-case per file
- One repository per file
- One action per file
- One schema per file
- One component per file

Avoid multi-purpose files.

Bad:

```ts
user.service.ts
```

Contains:

- create user
- update user
- delete user
- login
- register
- forgot password

Good:

```ts
create-user.use-case.ts
update-user.use-case.ts
delete-user.use-case.ts
login.use-case.ts
```

---

# Project Structure

```txt
src/
├── app/
├── modules/
├── common/
├── infrastructure/
└── types/
```

---

# App Router Rules

Everything inside:

```txt
src/app/
```

is responsible only for:

- routing
- layouts
- page composition
- route handlers

Examples:

```txt
app/
├── dashboard/
│   └── page.tsx
├── users/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── api/
```

Business logic must never live here.

---

# Feature Driven Structure

Every business domain belongs inside:

```txt
src/modules/
```

Example:

```txt
src/modules/
├── auth/
├── users/
├── products/
├── orders/
└── payments/
```

Never organize by technical layer globally.

Avoid:

```txt
src/actions/
src/services/
src/repositories/
src/hooks/
```

Always organize by feature.

---

# Standard Feature Structure

Every feature should follow:

```txt
feature/
├── actions/
├── use-cases/
├── repositories/
├── services/
├── schemas/
├── components/
├── hooks/
├── types/
├── constants/
└── index.ts
```

Example:

```txt
users/
├── actions/
├── use-cases/
├── repositories/
├── services/
├── schemas/
├── components/
├── hooks/
└── types/
```

---

# Server Component First

Default to:

```tsx
export default async function Page() {}
```

Use Server Components whenever possible.

Advantages:

- better performance
- reduced bundle size
- better SEO
- less client JavaScript

---

# Client Component Rules

Use:

```tsx
"use client";
```

only when required.

Examples:

- useState
- useEffect
- useReducer
- DOM access
- event handlers

Avoid turning entire pages into Client Components.

---

# Page Rules

Pages are composition layers.

Pages may:

- render UI
- load data
- call actions
- handle route params
- handle search params

Pages must NOT:

- contain business logic
- contain validation logic
- contain database queries
- contain external service logic

Keep pages thin.

Target:

```txt
< 150 lines
```

---

# Component Rules

Components are presentation layers.

Components may:

- render UI
- manage local UI state
- receive props

Components must NOT:

- access Prisma
- contain business rules
- perform database operations

Prefer:

```txt
user-card.tsx
user-form.tsx
user-table.tsx
```

Avoid giant components.

---

# Server Action Rules

Server Actions are orchestration layers.

Responsibilities:

- receive input
- validate input
- execute use-case
- return result

Example:

```ts
"use server";

export async function createUserAction(
  input: CreateUserInput
) {
  return createUserUseCase.execute(input);
}
```

Server Actions must NOT:

- access Prisma directly
- contain business logic
- become massive files

---

# Route Handler Rules

Route Handlers should:

- parse request
- validate request
- execute use-case
- return response

Example:

```txt
app/api/users/route.ts
```

Route Handlers must NOT:

- contain business logic
- access Prisma directly

---

# Business Logic Rules

Business logic belongs only inside:

```txt
use-cases/
```

Examples:

```txt
create-user.use-case.ts
update-user.use-case.ts
delete-user.use-case.ts
```

Use-cases should:

- expose execute()
- have one responsibility
- be framework independent

Example:

```ts
export class CreateUserUseCase {
  async execute(input: CreateUserInput) {}
}
```

---

# Validation Rules

Validation uses:

```txt
Zod
```

One schema per use-case.

Examples:

```txt
create-user.schema.ts
update-user.schema.ts
login.schema.ts
```

Schemas are the source of truth.

Example:

```ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

---

# Repository Rules

Repositories handle:

- Prisma
- SQL
- database access
- persistence

Repositories must NOT:

- contain business logic
- contain UI logic
- contain validation logic

Example:

```ts
export class UserRepository {
  async findByEmail(email: string) {}
}
```

---

# Prisma Rules

Prisma access is restricted.

Allowed:

```txt
repositories/
```

Forbidden:

```txt
page.tsx
component.tsx
action.ts
route.ts
hook.ts
```

Never call:

```ts
prisma.user.findMany()
```

outside repositories.

---

# Service Rules

Services handle reusable integrations.

Examples:

```txt
mail.service.ts
storage.service.ts
cache.service.ts
payment.service.ts
auth.service.ts
```

Services should:

- remain focused
- be reusable
- avoid domain business logic

Avoid God Services.

Bad:

```txt
app.service.ts
system.service.ts
```

---

# Hook Rules

Hooks handle reusable client logic.

Examples:

```txt
use-auth.ts
use-pagination.ts
use-debounce.ts
```

Hooks must NOT:

- contain business logic
- access database
- access Prisma

---

# Shared Code Rules

Shared code belongs inside:

```txt
src/common/
```

Example:

```txt
common/
├── components/
├── hooks/
├── utils/
├── constants/
├── validators/
└── lib/
```

Only reusable code belongs here.

Never place feature-specific logic in common.

---

# Infrastructure Rules

External systems belong inside:

```txt
src/infrastructure/
```

Examples:

```txt
infrastructure/
├── prisma/
├── redis/
├── cache/
├── storage/
├── queue/
└── payments/
```

Infrastructure should never contain business rules.

---

# Dependency Flow

Allowed:

```txt
Page
↓
Action
↓
Use Case
↓
Repository
↓
Prisma
↓
Database
```

Alternative:

```txt
Route Handler
↓
Use Case
↓
Repository
↓
Database
```

Forbidden:

```txt
Component → Prisma
Page → Prisma
Action → Prisma
Repository → Component
```

Avoid circular dependencies.

---

# Naming Convention

Use:

```txt
kebab-case
```

Examples:

```txt
create-user.use-case.ts
create-user.schema.ts
create-user.action.ts
user.repository.ts
user-card.tsx
```

Avoid:

```txt
CreateUser.ts
UserService.ts
userStuff.ts
LOGIN.ts
```

---

# File Size Limits

Recommended maximum:

```txt
Page        ≤ 150 lines
Component   ≤ 200 lines
Action      ≤ 100 lines
Use Case    ≤ 150 lines
Repository  ≤ 150 lines
Hook        ≤ 100 lines
```

Split files when limits are exceeded.

---

# Clean Code Rules

Always:

- prefer composition over inheritance
- use explicit naming
- keep functions small
- avoid magic values
- separate concerns aggressively
- write self-documenting code

Avoid:

```txt
- giant files
- nested logic hell
- duplicated business logic
- dumping everything into utils
```

---

# Forbidden Rules

Never:

- query Prisma inside pages
- query Prisma inside components
- query Prisma inside actions
- place business logic inside actions
- place business logic inside route handlers
- create generic utility dumping grounds
- create massive service files
- duplicate business logic

---

# AI Agent Workflow

Before generating code:

1. Identify feature
2. Identify use-case
3. Create schema
4. Create repository
5. Create use-case
6. Create action
7. Create components
8. Connect page
9. Connect route
10. Test flow

Never skip layers.

---

# AI Assistant Requirements

When generating new features:

- create feature structure automatically
- create schema before use-case
- create repository before action
- separate UI from business logic
- follow dependency flow strictly
- reuse existing code whenever possible
- setiap membuat plan (rencana implementasi) wajib menggunakan Bahasa Indonesia

Do not sacrifice architecture for shorter code.

---

# Golden Rule

If a file cannot be explained in one sentence, it probably has more than one responsibility and should be split.

---

# Database Sync Rule

When adding or modifying data fields in the frontend (mock-db, local storage, components), you MUST:
1. Update `prisma/schema.prisma` with the new fields.
2. Run `npx prisma db push` to push the changes to Supabase.
3. Update the synchronization API (`src/app/api/db-sync/route.ts`) to ensure the new fields are included in the `create` and `update` queries.
Never leave database modifications hanging only in local storage!
