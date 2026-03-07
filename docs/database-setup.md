# Database Setup (Supabase)

## Initial Setup

1. Create a new Supabase project at https://supabase.com
2. Enable Google OAuth provider:
   - Go to Authentication → Providers in Supabase dashboard
   - Enable Google provider
   - Add Google OAuth credentials (Client ID & Secret from Google Cloud Console)
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Copy your project URL and anon key to `.env.local`
4. Run the SQL migrations below in Supabase SQL Editor

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Current Tables & Policies

This is the authoritative current state. Run all SQL below on a fresh project to reach the same state.

---

### Table: `facilitators`

Email allowlist. Only users whose email appears here can access the facilitator dashboard.

```sql
create table facilitators (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

alter table facilitators enable row level security;

-- Authenticated users can check if their own email is approved
create policy "Check own facilitator status"
  on facilitators for select
  to authenticated
  using (auth.email() = email);
```

To add or remove facilitators:

```sql
-- Add
insert into facilitators (email, name) values ('facilitator@example.com', 'Name');

-- Remove
delete from facilitators where email = 'facilitator@example.com';
```

---

### Table: `sessions`

Workshop sessions. `facilitator_id` is kept as a `created_by` audit field but is **not** used as an access gate — all facilitators can see and manage all sessions.

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  facilitator_id uuid references auth.users(id) on delete set null,
  name text not null,
  status text not null default 'created'
    check (status in ('created', 'registration_open', 'started', 'closed')),
  created_at timestamptz default now()
);

create index idx_sessions_status on sessions(status);

alter table sessions enable row level security;

-- Any facilitator can view/create/update all sessions
create policy "Facilitators can view all sessions" on sessions
  for select using (
    exists (select 1 from facilitators where email = auth.email())
  );

create policy "Facilitators can insert sessions" on sessions
  for insert with check (
    exists (select 1 from facilitators where email = auth.email())
  );

create policy "Facilitators can update sessions" on sessions
  for update using (
    exists (select 1 from facilitators where email = auth.email())
  );

-- Unauthenticated participants can view sessions that are open or in progress
create policy "Anyone can view open sessions" on sessions
  for select using (
    status in ('created', 'registration_open', 'started')
  );
```

---

### Table: `questions`

Questions added to a session by facilitators. Participants answer these about each other.

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  question_text text not null,
  order_index integer not null,
  created_at timestamptz default now()
);

create index idx_questions_session on questions(session_id);

alter table questions enable row level security;

-- Facilitators can fully manage questions
create policy "Facilitators can select questions" on questions
  for select using (
    exists (select 1 from facilitators where email = auth.email())
  );

create policy "Facilitators can insert questions" on questions
  for insert with check (
    exists (select 1 from facilitators where email = auth.email())
  );

create policy "Facilitators can update questions" on questions
  for update using (
    exists (select 1 from facilitators where email = auth.email())
  );

create policy "Facilitators can delete questions" on questions
  for delete using (
    exists (select 1 from facilitators where email = auth.email())
  );
```

---

### Table: `participants`

Participants who register for a session. No Supabase Auth link — identified by UUID stored in the browser's localStorage.

```sql
create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  registered_at timestamptz default now()
);

create index idx_participants_session on participants(session_id);

alter table participants enable row level security;

-- Anyone (unauthenticated) can register for sessions that are open
create policy "Anyone can register for open sessions" on participants
  for insert with check (
    exists (
      select 1 from sessions
      where sessions.id = session_id
      and sessions.status in ('created', 'registration_open')
    )
  );

-- Anyone can read participants (needed to verify stored participant ID on return)
create policy "Anyone can read participants" on participants
  for select using (true);

-- Anyone can update their own participant record (e.g. rename themselves)
create policy "Participants can update their own name" on participants
  for update using (true) with check (true);
```

---

### Enable Realtime

```sql
-- Required for live participant list updates on the session page
alter publication supabase_realtime add table participants;
```

---

## Testing

After running migrations, verify:
1. An unauthenticated user can load `/register/[sessionId]` when session status is `registration_open`
2. An unauthenticated user can insert a participant row
3. A facilitator (email in `facilitators` table) can log in and see all sessions
4. Realtime subscription on the session page shows new participants without refresh
