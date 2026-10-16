# @unspoken/api

The Unspoken HTTP service. It implements [`@unspoken/api-contract`](../../packages/api-contract) with [Hono](https://hono.dev) on Node: rules and dealing come from `@unspoken/core`, cards from `@unspoken/content`, and feedback goes to PostgreSQL through [`pg`](https://node-postgres.com). It runs on [Railway](https://railway.com), next to a Railway Postgres database.

| Endpoint | Does |
| --- | --- |
| `GET /v1/config` | The rules (`gameConfig`) |
| `POST /v1/decks` | Deals a deck with `dealFromBank`: difficulty, themes (none means All cards), mode, count, seed |
| `POST /v1/feedback` | Stores an idea in the `feedback` table and answers 201 with `{ id, receivedAt }`. Answers 503 `unavailable` when `DATABASE_URL` is not set. Rate limited per caller. |
| `GET /health` | `{ "status": "ok" }`, Railway's deploy health check |

Requests are validated with the contract's schemas. Every error has the contract's body, `{ error: { code, message, issues? } }`, with the status from `apiErrorStatus`: `invalid_request` 400, `not_found` 404, `payload_too_large` 413, `rate_limited` 429 (with `Retry-After`), `internal` 500 (database errors included; the details go to the log, never the response), `unavailable` 503.

## Run it locally

From the repository root, after `pnpm install`:

```bash
cp services/api/.env.example services/api/.env.local   # every variable, with its default
pnpm --filter @unspoken/api dev                         # http://localhost:8080, restarts on changes
```

Without `DATABASE_URL`, feedback answers 503 and everything else works. To store feedback, run a Postgres and point the service at it; it creates its tables on start:

```bash
docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=unspoken postgres:18-alpine
# in .env.local:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unspoken
```

Scripts: `dev`, `build` (bundles `src/main.ts` and the workspace packages into `dist/main.js` with esbuild), `start` (runs the bundle), `lint`, `typecheck`, `test`. Root `pnpm check` covers this package. Only `pg` is a runtime dependency; everything else is bundled at build time, so it is listed under `devDependencies`.

## Configuration

Everything deployment-specific comes from environment variables, validated at startup by `src/config.ts`. A bad value stops the service with a message naming the variable (never repeating it, since `DATABASE_URL` holds a password). [`.env.example`](.env.example) lists each one with its default: `PORT`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`, `BODY_LIMIT_BYTES`, `FEEDBACK_RATE_LIMIT`, `FEEDBACK_RATE_WINDOW_SECONDS` and `DATABASE_URL`.

- **CORS:** list browser origins exactly, such as `https://xsophiexu.github.io` (no `/unspoken` path). Native apps send no Origin and need no entry.
- **Rate limit:** counted per caller address, in memory, per replica, so N replicas allow N times the limit. The address comes from `X-Forwarded-For`, `TRUST_PROXY_HOPS` entries from the end. The Docker image sets 2 for Railway, whose edge sends the client followed by one hop of its own. Railway's docs don't describe that header, so after the first deploy check that the limit is per caller: send six ideas from one network and the sixth answers 429, while another network (a phone off Wi-Fi) still gets 201.
- **Database:** each `feedback` row holds the validated request (`topic`, `message`, and `entry_point`, `platform`, `app_version`, null when not sent) plus `id` (a UUID, returned as the receipt's `id`) and `received_at`. The schema is a list of numbered migrations in `src/db.ts`, applied on every start: each runs once, in one transaction, under a lock, so restarts and replicas starting together are safe. Change the schema by appending a migration, never by editing one. When the database can't be reached at start, the service exits and Railway restarts it (On Failure, up to 10 times by default). To read feedback, open the Postgres service's **Data** tab in Railway, or run `railway connect Postgres` and `select * from feedback order by received_at desc;`.

## Deploy on Railway

Railway builds `services/api/Dockerfile` from the **repository root**, not from `services/api`: the image bundles the workspace packages `packages/core`, `packages/content` and `packages/api-contract` and installs from the root `pnpm-lock.yaml`, so the build needs the whole repository. Railway deploys the `main` branch, so merge this service into `main` first. After that, every push to `main` that touches the service or those packages redeploys it.

In the Railway dashboard:

1. **New Project → Deploy from GitHub repo**, and choose `xsophiexu/unspoken` (let Railway's GitHub app see the repository if it asks). Leave **Root Directory** empty. Renaming the service to `api` is optional.
2. On the project canvas, **+ New → Database → PostgreSQL**. Keep its name, `Postgres`.
3. In the service's **Variables**, add:
   - `RAILWAY_DOCKERFILE_PATH` = `services/api/Dockerfile`
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `CORS_ORIGINS` = `https://xsophiexu.github.io`, plus the Next.js site's origin once it has one, comma-separated
4. In the service's **Settings**, set **Healthcheck Path** to `/health` and **Watch Paths** to `/services/api/**`, `/packages/core/**`, `/packages/content/**`, `/packages/api-contract/**`, `/package.json` and `/pnpm-lock.yaml`. Leave the start command and `PORT` alone: the image runs `node --enable-source-maps dist/main.js`, which listens on the `PORT` Railway sets.
5. **Deploy** the staged changes. When the deploy is green, open **Settings → Networking → Generate Domain**.

The same setup is written as code in [`.railway/railway.ts`](.railway/railway.ts), Railway's infrastructure-as-code file (Railway no longer reads `railway.json` for new services). With the [Railway CLI](https://docs.railway.com/cli), from `services/api`: `railway login`, `railway init`, `railway config plan`, `railway config apply`, then `railway domain --service api` instead of the steps above.

Then open `https://<domain>/health`, which answers `{"status":"ok"}`, and give `https://<domain>` to the apps as `NEXT_PUBLIC_API_URL` (`apps/web`) and `EXPO_PUBLIC_API_URL` (`apps/mobile`). Before replacing a deployment Railway sends SIGTERM, and the service finishes in-flight requests before it exits.

## Layout

```
.railway/railway.ts    the Railway project as code: Postgres and this service
src/main.ts            reads the config, connects to Postgres and migrates when DATABASE_URL is set, serves the app, stops cleanly on SIGTERM
src/app.ts             createApp(config, { db }): middleware, route modules, errors
src/config.ts          the environment schema
src/db.ts              the database boundary and the schema migrations
src/http.ts            error responses, JSON validation with contract schemas
src/rate-limit.ts      per-caller limit and caller address
src/routes/game.ts     /v1/config and /v1/decks
src/routes/feedback.ts /v1/feedback
test/                  HTTP tests through app.request, against PGlite (Postgres in process) and a fake clock
```

**Multiplayer, later:** add `paths.rooms` to the contract, a `src/routes/rooms.ts` module mounted in `app.ts`, and realtime with `upgradeWebSocket` from `@hono/node-server` (plus `ws`), passed to `serve({ websocket })` in `main.ts`. Rooms can hold core's round state as is, since it is plain serializable data. With several replicas, keep room state in a shared store such as Postgres, since a player's requests can reach any replica.
