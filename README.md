# Ticketsystem

MVP skeleton for an internal ticket system: **Next.js (App Router) + TypeScript**, **Firebase Auth** (client), and **Cloud Firestore**. Roles are **Firebase custom claims**: `admin` | `agent` | `viewer`.

Hosting on Hetzner/Docker, a Board view, and Mail-In are **out of scope** for this skeleton.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Firebase Auth (email/password) on the client
- Cloud Firestore for tickets and comments
- Firebase Admin SDK stub for server-side claim/user management later

## Local setup

Requires **Node.js 18+** (20+ recommended) and npm.

```bash
npm install
cp .env.example .env.local
# fill in Firebase values (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits to `/inbox` redirect to `/login` once client env vars are set.

### Build without secrets

`npm run build` does **not** require Firebase credentials. Client and Admin SDKs initialize lazily; missing env vars skip Auth redirects and show a configuration banner instead of failing the build.

```bash
npm install
npm run build
```

## Environment variables

Copy `.env.example` → `.env.local`. Never commit real keys (`.env*` and service-account JSON are gitignored).

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | `<project-id>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firebase / GCP project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Default storage bucket (optional for this MVP) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Cloud Messaging sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase app id |
| `FIREBASE_ADMIN_PROJECT_ID` | Server | Service account `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server | Service account `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server | Service account `private_key` (use `\n` for newlines) |

Create a web app in the Firebase console for the `NEXT_PUBLIC_*` values. Create a service account (Firebase Admin SDK) for the `FIREBASE_ADMIN_*` values. Do not put Admin keys in `NEXT_PUBLIC_*` variables.

## Firebase App Hosting

Production deploys use **Firebase App Hosting** (Cloud Run + Cloud Build) for this Next.js app. That is separate from classic Firebase Hosting. `firebase.json` only deploys Firestore rules and indexes. Runtime settings and secret references live in `apphosting.yaml`. Do not commit `.env.local`, real keys, or a service-account JSON file.

**Region:** App Hosting does not offer `europe-west6` (Zurich). When creating the backend, choose **`europe-west4` (Netherlands)** — the closest supported region. Other locations are `us-central1`, `us-east4`, `us-east5`, `asia-east1`, and `asia-southeast1`. The region is set on the backend, not in `apphosting.yaml`.

Firebase project: `ticketsystem-570a1`.

### Create the backend

1. Open the [Firebase console](https://console.firebase.google.com/) for project `ticketsystem-570a1`.
2. Go to **Hosting & Serverless → App Hosting** and choose **Create backend** (or **Get started** for the first backend).
3. Region: **`europe-west4`**.
4. Connect the GitHub repository **`yhayoz/Ticketsystem`** (install the Firebase GitHub app if prompted).
5. Live branch: **`main`**. App root directory: **`/`**.
6. Leave **automatic rollouts** enabled. A push to `main` builds and rolls out a new revision.

Node.js is selected on the backend (use the recommended current runtime; this app expects Node 20+). `apphosting.yaml` sets a small Cloud Run shape: 1 vCPU, 512 MiB, concurrency 80, scale from 0 to 4 instances.

### Secrets

Only `NEXT_PUBLIC_*` values may appear in the browser. App Hosting inlines them at **build** time, so they are available at **BUILD** and **RUNTIME**. `FIREBASE_ADMIN_*` stays on the server and is **RUNTIME** only. The image build does not need Admin credentials.

App Hosting reserves the `FIREBASE_` prefix for Secret Manager ids (`Key FIREBASE_API_KEY starts with a reserved prefix`). Secret ids therefore use `TICKETS_*`. The `variable:` names in `apphosting.yaml` stay `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_ADMIN_*`.

Set each secret in the console (**App Hosting → backend → Settings → Environment**) or with the CLI (from this repo, Firebase CLI 13.15.4+):

```bash
firebase apphosting:secrets:set TICKETS_API_KEY --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_AUTH_DOMAIN --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_PROJECT_ID --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_STORAGE_BUCKET --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_MESSAGING_SENDER_ID --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_APP_ID --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_ADMIN_PROJECT_ID --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_ADMIN_CLIENT_EMAIL --project ticketsystem-570a1
firebase apphosting:secrets:set TICKETS_ADMIN_PRIVATE_KEY --project ticketsystem-570a1
```

Grant the App Hosting backend access if you created the secrets outside that flow:

```bash
firebase apphosting:secrets:grantaccess --project ticketsystem-570a1
```

| App variable | Secret Manager name | Availability |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `TICKETS_API_KEY` | BUILD + RUNTIME |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `TICKETS_AUTH_DOMAIN` | BUILD + RUNTIME |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `TICKETS_PROJECT_ID` | BUILD + RUNTIME |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `TICKETS_STORAGE_BUCKET` | BUILD + RUNTIME |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `TICKETS_MESSAGING_SENDER_ID` | BUILD + RUNTIME |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `TICKETS_APP_ID` | BUILD + RUNTIME |
| `FIREBASE_ADMIN_PROJECT_ID` | `TICKETS_ADMIN_PROJECT_ID` | RUNTIME |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `TICKETS_ADMIN_CLIENT_EMAIL` | RUNTIME |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `TICKETS_ADMIN_PRIVATE_KEY` | RUNTIME |

For `TICKETS_ADMIN_PRIVATE_KEY` (env `FIREBASE_ADMIN_PRIVATE_KEY`), store the service-account PEM. Real newlines are fine; a single line with `\n` escapes is also fine — the server turns those escapes into newlines. Do not prefix Admin secrets with `NEXT_PUBLIC_`.

Client secrets must exist before the first rollout, or the browser bundle is built without Firebase config. After secrets change, push to `main` (or start a rollout in the console) so a new build picks them up.

## Auth and roles

1. Enable **Email/Password** in Firebase Authentication.
2. Set a custom claim on each user, e.g. with the Admin stub in `src/lib/firebase/admin.ts`:

   ```ts
   await setUserRole(uid, 'agent'); // 'admin' | 'agent' | 'viewer'
   ```

3. The ID token exposes `request.auth.token.role`, which `firestore.rules` uses.

| Role | Inbox / detail | Create / update tickets & comments | Delete tickets |
| --- | --- | --- | --- |
| `admin` | yes | yes | yes |
| `agent` | yes | yes | no |
| `viewer` | yes | no | no |

## Data model

### `tickets/{ticketId}`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Required |
| `description` | string | |
| `status` | `'open' \| 'in_progress' \| 'done' \| 'closed'` | |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | |
| `assigneeId` | string \| null | Firebase Auth uid, or `null` |
| `createdBy` | string | Author uid (immutable after create) |
| `createdAt` | timestamp | Immutable after create |
| `updatedAt` | timestamp | Bumped on ticket edits and new comments |

### `tickets/{ticketId}/comments/{commentId}`

Comments live in a **subcollection**, not as arrays on the ticket document.

| Field | Type |
| --- | --- |
| `body` | string |
| `authorId` | string |
| `createdAt` | timestamp |

### `members/{uid}` (optional)

Thin directory for assignee pickers. **Authorization still uses custom claims**, not this collection.

| Field | Type |
| --- | --- |
| `email` | string |
| `displayName` | string |
| `role` | `'admin' \| 'agent' \| 'viewer'` |

## Firestore composite indexes

Inbox filters by `status` and/or `assigneeId` and always sorts by `updatedAt` descending. Create these indexes **early** (console → Firestore → Indexes, or `firebase deploy --only firestore:indexes`). They are also listed in `firestore.indexes.json`.

### 1. `status` + `assigneeId` + `updatedAt` (both filters)

Collection: **`tickets`**

| Field | Order |
| --- | --- |
| `status` | Ascending |
| `assigneeId` | Ascending |
| `updatedAt` | Descending |

### 2. `status` + `updatedAt` (status filter only)

Collection: **`tickets`**

| Field | Order |
| --- | --- |
| `status` | Ascending |
| `updatedAt` | Descending |

### 3. `assigneeId` + `updatedAt` (assignee filter only)

Collection: **`tickets`**

| Field | Order |
| --- | --- |
| `assigneeId` | Ascending |
| `updatedAt` | Descending |

Single-field `updatedAt` (unfiltered inbox) and `comments.createdAt` are created automatically.

## Security rules

`firestore.rules` is a readable starting point: staff can read; agents and admins write tickets/comments; only admins delete tickets or edit comments. Deploy with:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## App routes

| Path | Purpose |
| --- | --- |
| `/login` | Email/password sign-in (and optional account create) |
| `/inbox` | Ticket list sorted by `updatedAt`, filters for status + assignee + title search, primary action **Neues Ticket** |
| `/tickets/new` | Create a ticket |
| `/tickets/[id]` | Header (editable title + status/priority/assignee), description, comments subcollection thread |
| `/tickets/preview` | Static layout sample when Firebase is not configured |

Title search is applied client-side on the current result set so it does not need an extra Firestore index.

## Follow-up (not in this skeleton)

- Full German copy / i18n
- Admin delete control in the UI (`deleteTicket` helper already exists)
- Board view, Mail-In, Hetzner/Docker hosting

## Project structure

```
src/app/                 App Router pages and API
src/components/          Auth, layout, ticket UI
src/lib/firebase/        Client SDK + Admin stub
src/lib/tickets.ts       Typed ticket CRUD
src/lib/comments.ts      Typed comment CRUD
src/lib/members.ts       Optional members listing
src/types/               Ticket, Comment, Member, Role
firestore.rules          Role-based access sketch
firestore.indexes.json   Composite indexes above
apphosting.yaml          Firebase App Hosting runtime + secret refs
```

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (no Firebase env required)
npm start        # serve the production build
npm run lint
```
