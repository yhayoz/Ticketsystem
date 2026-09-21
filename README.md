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
```

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (no Firebase env required)
npm start        # serve the production build
npm run lint
```
