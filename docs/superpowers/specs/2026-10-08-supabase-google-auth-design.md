# Supabase auth + customer dashboard — design

**Date:** 2026-10-08
**Status:** awaiting review
**Scope:** browser build only. Capacitor native Google sign-in is explicitly deferred.

---

## 1. Intent and constraints

Make the existing login modal real: a customer signs in with Google, is asked for a
username, and lands on a dashboard. Supabase is the database and identity provider.

Agreed decisions:

- **Web first.** One code path, no deep links, no native plugin, no Android/iOS
  manifest work.
- **Profiles table only.** No bookings, favorites or recommended-styles tables yet.
- **Username is required and unique.** The customer cannot reach the dashboard
  without choosing one. Enforced in the database, not just in the UI.
- **Dashboard is a layout shell plus identity.** Avatar, username, email, sign out.
  No other content.
- **Nav avatar goes straight to the dashboard** on click. No dropdown.
- **Session state via a React context provider**, not a hand-rolled store.
- **Username step is a `/welcome` route**, not a stacked modal, so it survives a
  refresh and the guard has a real destination.

Success means: a customer can reach `/dashboard` from the login modal in a browser,
their profile row exists, their username is unique, and no other customer can read or
write that row.

## 2. Security prerequisite

`.gitignore` currently lists `.env.local` variants but **not** plain `.env`. The file
exists, is empty, and is untracked, but it is not ignored — so the first credential
written into it would be committed by `git add .`.

Fix, part of this work:

- Add `.env` and `.env.local` to `.gitignore`.
- Commit `.env.example` with the key **names** and placeholder values only.

The Supabase **publishable** key (`sb_publishable_…`) is designed to ship in a client
bundle and is not a secret. The **service role** key must never appear in `src/`, in a
`VITE_`-prefixed variable, or in any committed file. `VITE_`-prefixed variables are
inlined into the client bundle at build time, so anything named `VITE_` is public by
definition.

## 3. Environment variables

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key, safe for the client |

## 4. Architecture

One new dependency: `@supabase/supabase-js`.

```
src/lib/supabase.ts         singleton client
src/auth/AuthProvider.tsx   context + onAuthStateChange subscription
src/auth/RequireAuth.tsx    route guard
src/pages/AuthCallback.tsx  /auth/callback
src/pages/Welcome.tsx       /welcome
src/pages/Dashboard.tsx     /dashboard
src/pages/Dashboard.css
```

Modified: `src/components/layout/Nav.tsx`, `src/components/layout/LoginModal.tsx`,
`src/App.tsx`, `.gitignore`. Added: `.env.example`.

### 4.1 `src/lib/supabase.ts`

Exports a single `supabase` client created once at module load.

```ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
```

`detectSessionInUrl` is left at its default. The PKCE callback route performs the
exchange explicitly, so nothing else should consume the URL fragment.

### 4.2 `src/auth/AuthProvider.tsx`

Single subscription for the whole app. Exposed value:

```ts
interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
}
```

Behaviour:

- On mount, reads the existing session, then subscribes to `onAuthStateChange`.
- When a session exists, fetches the customer's `profiles` row by `id`.
- `isLoading` is true until the first session read resolves, so guards do not bounce
  a signed-in customer to `/welcome` during the initial fetch.
- `saveUsername` performs an **upsert** on the profile row keyed on `id` and re-reads
  it. Upsert rather than update because the trigger is the only thing guaranteed to
  create the row; if it ever fails, an update would silently affect zero rows and the
  customer would be stuck. Returns `ok: false` with a message rather than throwing, so
  the form can render it inline.
- `onAuthStateChange` must not call Supabase methods from inside its own callback —
  that deadlocks. Profile fetching is therefore done from a separate effect keyed on
  `session?.user.id`, never from inside the auth listener.

```ts
interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}
```

### 4.3 `src/auth/RequireAuth.tsx`

```tsx
interface RequireAuthProps {
  children: ReactNode;
  requireUsername?: boolean;
}
```

- No session → `<Navigate to="/home" replace />`.
- Session but `requireUsername` and `profile.username` is null → `/welcome`.
- Renders a brief loading state while `isLoading`, rather than redirecting, to avoid a
  flash on hard refresh.

### 4.4 `src/pages/AuthCallback.tsx`

Minimal page at `/auth/callback`, black background, small Footlight "Signing you in…".

- Reads `code` and `error` from the query string.
- On `error`, renders a plain message with a link back to the login modal.
- On `code`, calls `supabase.auth.exchangeCodeForSession(code)`, then navigates to
  `/home`.
- On exchange failure, renders the error message rather than looping.

### 4.5 `src/pages/Welcome.tsx`

"What should we call you?" — Tritopani heading in `#FF622B`, Inter input, Footlight
submit button. No dismiss affordance: this is a gate.

- Client validation mirrors the database check: `^[a-z0-9_]{3,24}$`, lowercased before
  submission.
- On submit calls `saveUsername`. Postgres unique violation `23505` surfaces as
  "That name is taken." with the input value preserved.
- On success navigates to `/dashboard`.
- Signed-out access to this route redirects home.

### 4.6 `src/pages/Dashboard.tsx`

Matches the supplied wireframe:

- Top bar, black, full width, fixed height, sits under the fixed nav.
- Below it a two-column grid: black sidebar at roughly 25%, orange main area at 75%.
- A 1px dotted divider spans the full width under the top bar.
- Sidebar holds avatar, username, email, and a Sign out button.
- Main area is intentionally empty in this slice.

`Nav tone="light"` because the page behind it is black.

## 5. Data flow

1. Nav shows the word `login`, which opens `LoginModal`.
2. The Google button is gated on the terms checkbox. Clicking it unticked sets an
   inline "please agree first" message and does nothing else.
3. With the box ticked, `signInWithGoogle()` calls:

   ```ts
   await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${window.location.origin}/auth/callback` },
   });
   ```

   This performs a full page redirect to Google. Modal state is lost, which is why
   the gate is enforced before the redirect rather than after.
4. Google → Supabase → `/auth/callback?code=…`.
5. `exchangeCodeForSession(code)` stores the session in localStorage, then navigates to
   `/home`.
6. The provider's session effect fetches the profile row.
7. If `username` is null, `/dashboard` redirects to `/welcome`.
8. `/welcome` writes the username, then navigates to `/dashboard`.
9. The nav now renders the Google avatar (`user.user_metadata.avatar_url`) in place of
   the word `login`, linking to `/dashboard`.

## 6. Database

Applied as a single SQL migration in the Supabase SQL editor, saved alongside this work
as `supabase/migrations/0001_profiles.sql`.

```sql
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text unique
               check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  avatar_url   text,
  face_shape   text check (face_shape in ('oval','round','square','heart','oblong')),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Notes on the choices:

- `username` is nullable so the guard has an unambiguous "not chosen yet" state.
  Postgres permits many nulls in a unique index, so this does not weaken uniqueness
  for real values.
- `security definer` is required on the trigger function, otherwise the insert fails
  under RLS. `search_path` is pinned to stop it being hijacked.
- `(select auth.uid())` wraps the call in a subquery so it is evaluated once per query
  instead of once per row. This matters once the table has rows.
- `avatar_url` and `display_name` are copied from the Google profile at signup so the
  dashboard renders before the customer has filled anything in.

## 7. Nav changes

`tone` stays as it is. When a session exists, the `login` button is replaced by a
react-router `Link` to `/dashboard` wrapping the customer's avatar:

```tsx
<Link
  className="trim-nav__avatar"
  to="/dashboard"
  aria-label={`Dashboard, signed in as ${username ?? displayName}`}
>
  <img src={avatarUrl ?? ''} alt="" />
</Link>
```

Falls back to the first letter of the username on a coloured block when Google supplies
no avatar. A `Link` rather than an `<a>` so navigation stays client-side and Ionic does
not do a full page load.

## 8. Error handling

| Case | Behaviour |
| --- | --- |
| Customer cancels on Google's screen | `?error=access_denied` → callback page shows a message and a link back to login |
| Exchange fails | Message on the callback page, no redirect loop |
| Username already taken | Postgres `23505` → "That name is taken." inline, input keeps its value |
| Username fails the format check | Client validation blocks submit; the database check is the backstop |
| Network failure during sign-in | The `signInWithOAuth` error is caught and shown inline in the modal |
| Profile row missing | Treated as "no username". `saveUsername` upserts, so the row is created or updated either way |

Every failure path is visible to the customer. Nothing fails silently.

## 9. Testing

- Vitest unit tests for the username validation rule and the auth metadata to
  `Profile` mapping. Both are pure functions, so they need no Supabase connection.
- The Google round-trip cannot be automated without live credentials. `step.md`
  carries a manual verification checklist covering: first sign-in creates a profile
  row, a taken username is rejected, a second account cannot read the first one's row,
  and sign out clears the session.
- Existing `npx vitest run` must stay green.

## 10. Deliverables

1. The code above.
2. `supabase/migrations/0001_profiles.sql`, the exact SQL from section 6.
3. `step.md` at the repo root: a step-by-step setup guide covering creating the
   Supabase project, running the migration, configuring the Google provider in the
   Supabase dashboard, creating the Google OAuth client, adding redirect URLs, filling
   in `.env`, and the manual verification checklist from section 9.

## 11. Out of scope

Stated so it is not mistaken for an oversight:

- **Native Capacitor Google sign-in.** Deferred by decision. When it is picked up it
  needs a custom URL scheme on `com.trim.app`, Android intent-filter and iOS
  `Info.plist` entries, and a different code path (`signInWithIdToken` with a native
  Google SDK rather than browser OAuth).
- **Bookings, favorites, recommended styles.** No tables created.
- **Terms of Service and Privacy Policy pages.** The login modal renders both as bold
  text with no `href`, so they are not links yet. Wiring them needs real destination
  URLs and is a separate task.
- **Avatar upload.** The dashboard shows the Google avatar only.