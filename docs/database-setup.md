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

## SQL Migrations

### 1. Create Question Templates Table

```sql
CREATE TABLE question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_question_templates_category ON question_templates(category);
CREATE INDEX idx_question_templates_active ON question_templates(is_active);

-- Enable RLS
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active templates
CREATE POLICY "Authenticated users can view active templates"
  ON question_templates FOR SELECT
  USING (is_active = true);

-- Only admins can manage templates (you can adjust this based on your admin system)
-- For now, all authenticated users can manage (change this in production)
CREATE POLICY "Authenticated users can manage templates"
  ON question_templates FOR ALL
  USING (auth.role() = 'authenticated');
```

### Insert Default Question Templates

```sql
INSERT INTO question_templates (question_text, category) VALUES
  ('Who would you go to for advice?', 'leadership'),
  ('Who is the best listener in the group?', 'communication'),
  ('Who brings the most positive energy?', 'teamwork'),
  ('Who is most creative?', 'creativity'),
  ('Who would you want on your team for a challenging project?', 'collaboration'),
  ('Who is most organized?', 'organization'),
  ('Who is the best problem solver?', 'analytical'),
  ('Who makes others feel comfortable?', 'empathy'),
  ('Who is most reliable?', 'trustworthiness'),
  ('Who inspires others?', 'leadership');
```

### 2. Create Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'registration_open', 'started', 'closed')) DEFAULT 'created',
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_sessions_facilitator ON sessions(facilitator_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Facilitators can only see their own sessions
CREATE POLICY "Facilitators can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = facilitator_id);

CREATE POLICY "Facilitators can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Facilitators can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = facilitator_id);
```

### 3. Create Questions Table

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  template_id UUID REFERENCES question_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_questions_session ON questions(session_id);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions visible to session owner
CREATE POLICY "Facilitators can view questions in their sessions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.facilitator_id = auth.uid()
    )
  );

CREATE POLICY "Facilitators can manage questions in their sessions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.facilitator_id = auth.uid()
    )
  );

-- Participants can view questions in their session (during answering phase)
CREATE POLICY "Participants can view questions in started sessions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.status = 'started'
    )
  );
```

### 4. Create Participants Table

```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  answer_status TEXT NOT NULL CHECK (answer_status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_participants_session ON participants(session_id);

-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Anyone can register (create participant) if session is open
CREATE POLICY "Anyone can register for open sessions"
  ON participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
      AND sessions.status IN ('created', 'registration_open')
    )
  );

-- Participants in a session can view other participants in the same session
CREATE POLICY "Participants can view others in same session"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participants.session_id
      AND sessions.status IN ('registration_open', 'started')
    )
  );

-- Facilitators can view all participants in their sessions
CREATE POLICY "Facilitators can view participants in their sessions"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participants.session_id
      AND sessions.facilitator_id = auth.uid()
    )
  );

-- Participants can update their own status
CREATE POLICY "Participants can update own status"
  ON participants FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

### 5. Create Answers Table

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  selected_participant_1 UUID REFERENCES participants(id),
  selected_participant_2 UUID REFERENCES participants(id),
  selected_participant_3 UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one answer per participant per question
  UNIQUE(question_id, participant_id)
);

-- Indexes for faster queries
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_participant ON answers(participant_id);

-- Enable RLS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Participants can create their own answers
CREATE POLICY "Participants can submit own answers"
  ON answers FOR INSERT
  WITH CHECK (true);

-- Facilitators can view all answers in their sessions
CREATE POLICY "Facilitators can view answers in their sessions"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = answers.question_id
      AND sessions.facilitator_id = auth.uid()
    )
  );

-- Participants cannot view others' answers
-- (no policy = no access)
```

### 6. Enable Realtime

```sql
-- Enable realtime for participants table
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Enable realtime for answers table (for facilitator tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
```

## Helper Functions (Optional)

### Get Session Statistics

```sql
CREATE OR REPLACE FUNCTION get_session_stats(session_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_participants', COUNT(DISTINCT p.id),
    'completed_answers', COUNT(DISTINCT CASE WHEN p.answer_status = 'completed' THEN p.id END),
    'pending_answers', COUNT(DISTINCT CASE WHEN p.answer_status != 'completed' THEN p.id END)
  )
  FROM participants p
  WHERE p.session_id = session_uuid;
$$ LANGUAGE SQL STABLE;
```

## Testing

After running migrations, test:
1. Create a facilitator account via Supabase Auth
2. Insert a test session
3. Insert test participants
4. Verify RLS policies work correctly

## Facilitator Allowlist

Only pre-approved emails can access the facilitator dashboard. This is enforced in the auth callback.

### Create Facilitators Table

```sql
CREATE TABLE facilitators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE facilitators ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their own email is approved
CREATE POLICY "Check own facilitator status"
  ON facilitators FOR SELECT
  TO authenticated
  USING (auth.email() = email);
```

### Add Approved Facilitators

```sql
INSERT INTO facilitators (email, name) VALUES
  ('facilitator@example.com', 'Facilitator Name');
```

To add more facilitators later:

```sql
INSERT INTO facilitators (email, name) VALUES ('another@example.com', 'Another Name');
```

To remove a facilitator:

```sql
DELETE FROM facilitators WHERE email = 'facilitator@example.com';
```

## Applied Migrations

### Migration 1 — Sessions access: 1-to-many → many-to-many

Originally sessions were owned by a single facilitator via `facilitator_id` and RLS restricted each facilitator to their own sessions. This was changed so **all facilitators can see and manage all sessions**. The `facilitator_id` column is kept as a `created_by` audit field but is no longer used as an access gate.

```sql
-- Drop old per-facilitator policies
drop policy if exists "Facilitators can view own sessions" on sessions;
drop policy if exists "Facilitators can create sessions" on sessions;
drop policy if exists "Facilitators can update own sessions" on sessions;

-- New policies: any facilitator can access all sessions
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
```

### Migration 3 — Fix questions and participants RLS policies

The original questions and participants policies used `sessions.facilitator_id = auth.uid()` which broke after Migration 1. Updated to use the `facilitators` table instead.

```sql
-- Questions: drop old policies, add new ones
drop policy if exists "Facilitators can view questions in their sessions" on questions;
drop policy if exists "Facilitators can manage questions in their sessions" on questions;
drop policy if exists "Participants can view questions in started sessions" on questions;

create policy "Facilitators can select questions" on questions
  for select using (exists (select 1 from facilitators where email = auth.email()));

create policy "Facilitators can insert questions" on questions
  for insert with check (exists (select 1 from facilitators where email = auth.email()));

create policy "Facilitators can delete questions" on questions
  for delete using (exists (select 1 from facilitators where email = auth.email()));

-- Participants: fix facilitator view policy
drop policy if exists "Facilitators can view participants in their sessions" on participants;

create policy "Facilitators can view participants" on participants
  for select using (exists (select 1 from facilitators where email = auth.email()));
```
