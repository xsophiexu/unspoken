# @unspoken/api

The Unspoken HTTP service. It implements [`@unspoken/api-contract`](../../packages/api-contract) with [Hono](https://hono.dev) on Node: rules and dealing come from `@unspoken/core`, cards from `@unspoken/content`, and feedback goes to Cloud Firestore through the Firebase Admin SDK.

| Endpoint | Does |
| --- | --- |
| `GET /v1/config` | The rules (`gameConfig`) |
| `POST /v1/decks` | Deals a deck with `dealFromBank`: difficulty, themes (none means All cards), mode, count, seed |
| `POST /v1/feedback` | Stores an idea in Firestore and answers 201 with `{ id, receivedAt }`. Answers 503 `unavailable` when no Firebase project is configured. Rate limited per caller. |
| `GET /health` | `{ "status": "ok" }` for uptime checks. Not `/healthz`: Cloud Run reserves paths ending in `z`. |

Requests are validated with the contract's schemas. Every error has the contract's body, `{ error: { code, message, issues? } }`, with the status from `apiErrorStatus`: `invalid_request` 400, `not_found` 404, `payload_too_large` 413, `rate_limited` 429 (with `Retry-After`), `internal` 500, `unavailable` 503.

## Run it locally

From the repository root, after `pnpm install`:

```bash
cp services/api/.env.example services/api/.env.local   # every variable, with its default
pnpm --filter @unspoken/api dev                         # http://localhost:8080, restarts on changes
```

Without Firebase settings, feedback answers 503 and everything else works. To store feedback locally without a Google account, run the Firestore emulator (needs Java) and point the service at it:

```bash
npx firebase-tools emulators:start --only firestore --project demo-unspoken   # listens on 127.0.0.1:8080
```

and in `.env.local`:

```bash
PORT=8787                                # the emulator has 8080
FIREBASE_PROJECT_ID=demo-unspoken
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

Scripts: `dev`, `build` (bundles `src/main.ts` and the workspace packages into `dist/main.js` with esbuild), `start` (runs the bundle), `lint`, `typecheck`, `test`. Root `pnpm check` covers this package.

Only `firebase-admin` is a runtime dependency; everything else is bundled at build time, so it is listed under `devDependencies`.

## Configuration

Everything deployment-specific comes from environment variables, validated at startup by `src/config.ts`. A bad value stops the service with a message naming the variable. [`.env.example`](.env.example) lists each one with its default: `PORT`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`, `BODY_LIMIT_BYTES`, `FEEDBACK_RATE_LIMIT`, `FEEDBACK_RATE_WINDOW_SECONDS`, `FEEDBACK_COLLECTION`, `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT`.

- **CORS:** list browser origins exactly, such as `https://xsophiexu.github.io` (no `/unspoken` path). Native apps send no Origin and need no entry.
- **Rate limit:** counted per caller address, in memory, per instance. Behind Cloud Run the caller's address comes from `X-Forwarded-For` (`TRUST_PROXY_HOPS=1`, the Docker image's default). With several instances the effective limit is the limit times the instance count; cap it with `--max-instances`.
- **Feedback documents** hold the validated request (`topic`, `message`, and `entryPoint`, `platform`, `appVersion` when sent) plus `receivedAt` as a Firestore timestamp.

## Set up Firebase (once)

1. Go to [console.firebase.google.com](https://console.firebase.google.com), choose **Create a project**, and name it (for example `unspoken`). Google Analytics is optional. Note the **project ID** under Project settings; it is also the Google Cloud project ID.
2. In the project, open **Firestore Database** from the left menu and choose **Create database**: Standard edition, database ID `(default)` (the service uses the default database), a location near where the service will run (for example `us-central1` or `europe-west1`; it can't be changed later), and **production mode**. Production rules deny all client access, which is what we want: only this service writes, and the Admin SDK isn't bound by rules.
3. Give the service credentials, one of:
   - **On Cloud Run in the same project (recommended):** no key. Create a service account for the service and let it write to Firestore. The deploy below runs as it.
     ```bash
     gcloud iam service-accounts create unspoken-api --project <project-id>
     gcloud projects add-iam-policy-binding <project-id> \
       --member serviceAccount:unspoken-api@<project-id>.iam.gserviceaccount.com --role roles/datastore.user
     ```
   - **Anywhere else:** in the Firebase console, **Project settings → Service accounts → Generate new private key** downloads a JSON key. Put its contents on one line in `FIREBASE_SERVICE_ACCOUNT` (store it as a secret, never in git). The project ID is read from the key, so `FIREBASE_PROJECT_ID` is optional then.
   - **Locally against the real project:** `gcloud auth application-default login`, then set `FIREBASE_PROJECT_ID`.

## Deploy to Cloud Run

Run from the repository root, with the [gcloud CLI](https://cloud.google.com/sdk/docs/install) signed in to an account that owns the project. Cloud Run needs billing enabled on the project (the Blaze plan in Firebase terms); a small service like this usually stays inside the free tier.

```bash
PROJECT=<project-id>
REGION=us-central1
IMAGE=$REGION-docker.pkg.dev/$PROJECT/unspoken/api

# Once: turn on the services and create an image repository.
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $PROJECT
gcloud artifacts repositories create unspoken --repository-format docker --location $REGION --project $PROJECT

# Each release: build the image in Cloud Build (or locally: docker build -f services/api/Dockerfile -t $IMAGE . && docker push $IMAGE)
gcloud builds submit --config services/api/cloudbuild.yaml --substitutions _IMAGE=$IMAGE --project $PROJECT

gcloud run deploy unspoken-api --image $IMAGE --region $REGION --project $PROJECT \
  --service-account unspoken-api@$PROJECT.iam.gserviceaccount.com \
  --allow-unauthenticated --max-instances 3 \
  --set-env-vars FIREBASE_PROJECT_ID=$PROJECT,CORS_ORIGINS=https://xsophiexu.github.io
```

The deploy prints the service URL. Check `<url>/health`, then give the URL to the apps as `EXPO_PUBLIC_API_URL` and `NEXT_PUBLIC_API_URL`. To list several CORS origins, change gcloud's separator: `--set-env-vars "^;^FIREBASE_PROJECT_ID=$PROJECT;CORS_ORIGINS=https://a.example,https://b.example"`. On another host, run the same image and set `FIREBASE_SERVICE_ACCOUNT` from a secret (Cloud Run: `--set-secrets`).

## Layout

```
src/main.ts            reads the config, connects Firestore when configured, serves the app, stops cleanly on SIGTERM
src/app.ts             createApp(config, { firestore }): middleware, route modules, errors
src/config.ts          the environment schema
src/http.ts            error responses, JSON validation with contract schemas
src/rate-limit.ts      per-caller limit and caller address
src/routes/game.ts     /v1/config and /v1/decks
src/routes/feedback.ts /v1/feedback
test/                  HTTP tests through app.request, with a fake Firestore and a fake clock
```

**Multiplayer, later:** add `paths.rooms` to the contract, a `src/routes/rooms.ts` module mounted in `app.ts`, and realtime with `upgradeWebSocket` from `@hono/node-server` (plus `ws`), passed to `serve({ websocket })` in `main.ts`. Rooms can hold core's round state as is, since it is plain serializable data. Across several instances, keep room state in a shared store and turn on Cloud Run session affinity.
