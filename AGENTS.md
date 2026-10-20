# my_front AGENTS.md

Next.js 16 App Router chat frontend. React 19, Tailwind v4 (CSS-first, no tailwind.config), TypeScript strict, Biome 2.5, pnpm, better-auth + MongoDB, TanStack Query v5, Zustand, AI SDK v7.

## Commands

Run all commands from this directory. `vp` is not installed; the generated Vite+ section below is stale and its commands (`vp check`, `vp test`) do not exist here.

```bash
pnpm install
pnpm dev               # next dev, localhost:3000
pnpm build
pnpm check             # biome check --fix over the whole project (run after every edit)
pnpm check:ts          # tsc --noEmit over the whole project
./node_modules/.bin/biome check relative/path.tsx    # fast focused format+lint check
./node_modules/.bin/biome check --write relative/path.tsx   # autofix
./node_modules/.bin/tsc --noEmit      # uses tsconfig.tsbuildinfo incremental cache
```

Verification order: `biome check` on touched files first, then `pnpm check:ts` for the type sweep. Biome enforces tab indentation, double quotes, and sorted imports (organizeImports is on with safe fixes only). A failing `pnpm check` blocks, so format before typechecking.

Known pre-existing tsc error: `models/model.model.ts` reports `'description' does not exist` because the Provider schema exports a schema literal that does not declare `description`. Do not treat it as a regression from your own change. Fixing it means editing the Provider schema in `models/provider.model.ts`, not silencing tsc globally.

## Architecture

### Rendering flow

`app/layout.tsx` mounts `providers/theme-provider` (next-themes) and `providers/query-provider` (TanStack QueryClientProvider), plus sonner Toaster and the better-auth `SessionProvider` from `lib/auth-client`. `app/page.tsx` is the whole chat UI in practice: ChatSidebar + ChatHeader + messages + ChatInput.

`app/page.tsx` owns the `useChat` hook configured with `TextStreamChatTransport` pointed at `/api/llm/query`. Streaming transport is plain text chunks (no SSE). Message rendering passes AI `UIMessage` through `functions/mapToMessage.ts` into the `Message` type before handing it to `MessageBubble`. While AI `status` is `"submitted"`, `app/page.tsx` renders `components/chat/WaitingDots` under the message list; the dots disappear when streaming begins. `status === "streaming"` means ChatInput renders a stop button instead of a submit button.

### State ownership

`store/useChatStore.ts` is the single Zustand store. It holds conversations, selectedConversation, providers, selectedProvider, models, selectedModel, and input. Mutating conversation or provider state from any component must go through the store setters; components must not keep local copies. The `setSelectedConversation` and `setSelectedProvider` setters compare ids and stay silent when the id is unchanged, so callers may call them freely inside effects.

Server data reads use TanStack Query with query keys equal to the store slices they feed: `["models", selectedProvider]` refetches every 60 seconds and syncs into `setModels`; providers are loaded via the `getProviders` server action. Model filtering and selection logic lives in `components/chat/ModelsSelect.tsx`; fetching lives in the same component's `useQuery`. A provider change must clear `models` and `selectedModel`; the store does not do this automatically, components orchestrate it.

### Data layer

`models/*.model.ts` define Mongoose schemas; `types/*.type.ts` define Zod schemas and export the `Conversation`, `Message`, `Model`, `Provider`, `User` interfaces inferred with `z.infer`, plus `*Body` aliases created with `Omit<..., "id">` for creation payloads. Server code returns plain objects shaped by these types.

`lib/db.ts` holds a module-level memoized `Db` (`export const db: Db`); use it directly inside server actions and route handlers. `lib/auth.ts` is the better-auth server config backed by the Mongo adapter with GitHub and Google social providers; `lib/auth-client.ts` is the browser client that re-exports `useSession`. `app/api/auth/[...all]/route.ts` wires both into `toNextJsHandler`.

### Mutations and actions

`actions/conversation.action.ts` exports `createConversation`, `getConversations`, `getConversation`, `updateConversation`, `deleteConversation`. Each verifies a better-auth session atomically with the Mongo update — never write to these collections without attached `userId`. `actions/provider.action.ts` exports `getProviders`. Every conversation create/update also pushes from the client-side store (`setConversations`), so when you add a mutation, update both Mongo and the store the same way existing actions do, and keep the Zod `*Body` schema as the argument validator.

### LLM proxy routes

`app/api/llm/models/route.ts`: GET, proxy to `${RAG_URL}/models/${providerId}?base_url=${baseUrl}`. Returns `{ models: Model[] }` sorted by id and filtered to models that work with the provider key. Requires `RAG_URL` env, `providerId`, and `baseUrl` query params; conversions come from `selectedProvider` in the store.

`app/api/llm/query/route.ts`: POST, `runtime = "nodejs"`, `dynamic = "force-dynamic"`. Body contains `messages`, `provider`, `model`, `baseUrl`. The route flattens AI `UIMessage` parts to strings, posts `{ provider, model, question, history, base_url }` as plain JSON to `${RAG_URL}/llm/query`, and re-streams the response body straight to the client with `"Content-Type": "text/plain"` so `TextStreamChatTransport` can consume it. Chat body shape must stay in sync with `my_rag/models/request_model.py` (`provider`, `model`, `question`, `base_url`, `history` where history items are `{ role, content }`).

### UI primitives

`components/ui/select.tsx` wraps Base UI Select. `SelectContent` accepts a `listHeader` prop rendered above `SelectPrimitive.List` for fixed content inside the popup. Single-character keydowns pass into the popup and trigger Base UI typeahead, which preventDefaults them; any text input inside the popup must `stopPropagation()` for `event.key.length === 1` keys, the way `SearchField` in `ModelsSelect.tsx` does. ArrowUp/ArrowDown/Enter/Escape must keep bubbling for list navigation to work.

`components/ui/button.tsx` wraps Base UI Button. It always renders `type="button"` except when you pass `type="submit"` explicitly (later props win). The `loading` prop sets `disabled`, so a loading button cannot be clicked; to make a clickable control during loading, render a second button state without `loading` and pass the spinner through `icon`. Components needing this pattern: `ChatInput.tsx` submit/stop button pair.

Components must include `"use client"` unless the file is only used by server actions. Icons come from `@tabler/icons-react` with the `Icon` prefix. Styling is Tailwind classes with `cn` from `lib/utils` and the shadcn-style tokens (`.Primary`/`Muted`/`Popover` container tokens in CSS variables). For anything animated, prefer the CSS and motion primitives already in `components/reusable/`.

## Conventions

- Types go in `types/`, store mutations in `store/useChatStore.ts`, server code in `actions/` or `lib/`, reusable chat UI in `components/chat/`, primitives in `components/ui/`.
- New async server work belongs in a Next.js route under `app/api/` when it reaches the backend, in a server action under `actions/` when it reaches Mongo. Nothing else may `fetch` Rag or Mongo from the browser.
- Keep JSX in `components/chat/` free of direct business logic: kwargs, baseUrl selection, and error handling for the rag proxy belong in route handlers or actions.
- Do not hardcode provider names or labels; providers and models are data in Mongo, so UI reads them from the store.
- Run no `npm`-specific commands; `pnpm` only. Update the lockfile with `pnpm install` after every dependency change.

## Environment

`my_front/.env.development` and `my_front/.env.production` must contain: `MONGODB_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_URL`, `RAG_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. `RAG_URL` defaults to the rag service at port 8000 during development. Changing OAuth providers means editing both `lib/auth.ts` providers and the Google/GitHub client secret values in the env file they are read from.

The frontend is data-driven: providers are listed from Mongo through `getProviders`, and per-provider model availability is verified by the rag backend, so the app must be connected to MongoDB and `RAG_URL` for meaningful UI. When reporting missing data, check the store first, then the network tab of the proxy routes, then the rag server logs.
