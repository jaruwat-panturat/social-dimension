# Requirements

## Overview
This app is a tool for a psycology workshop for social-dimention.
It allow people to register to a session by scaning a QR code.
All people need to register by just puting their name as free text. (similar to when they register to a slido session)

## User Stories

### Facilitator (Workshop Leader)
- As a facilitator, I want to create a new workshop session so that participants can register for it
- As a facilitator, I want to select questions from a template library so that I don't have to write all questions from scratch
- As a facilitator, I want to manage questions (add, edit, delete) before starting the session so that I can customize the assessment
- As a facilitator, I want to generate a unique QR code for my session so that participants can easily join
- As a facilitator, I want to view all registered participants in real-time so that I know who is attending
- As a facilitator, I want to display the QR code on a screen so that multiple people can scan it simultaneously
- As a facilitator, I want to start the session after registration is complete so that the workshop can begin
- As a facilitator, I want to see how many participants have submitted their answers so that I know when to close the session
- As a facilitator, I want to close/end the session when I decide participants have had enough time so that I control the timing
- As a facilitator, I want to see results as 2D matrices for each question so that I can analyze selection patterns
- As a facilitator, I want to see a relationship graph showing all connections so that I can understand the group's social dynamics

### Participant (Workshop Attendee)
- As a participant, I want to scan a QR code with my phone so that I can quickly register for the workshop
- As a participant, I want to enter just my name so that registration is quick and simple
- As a participant, I want to see confirmation after registering so that I know I'm successfully enrolled
- As a participant, I want to register without creating an account so that the process is frictionless
- As a participant, I want to answer questions about other participants so that I can participate in the social dimension assessment
- As a participant, I want to select my top 3 people for each question so that I can provide meaningful responses
- As a participant, I want to see all other participants as answer options so that I can choose from everyone in the session
- As a participant, I want to submit my answers so that my responses are recorded
- As a participant, I want to see all my submitted answers in one place so that I can review what I submitted
- As a participant, I want to edit individual questions after submitting as long as the session is still open so that I can correct mistakes
- As a participant, I understand that I cannot see aggregated results or how others answered, only my own responses

## Functional Requirements

### Core Features

1. **Session Creation**
   - Facilitators can create a new workshop session
   - Each session has a unique ID and QR code
   - Sessions can be named/titled by the facilitator
   - Acceptance criteria: Create session, generate unique link and QR code
   - Priority: High

2. **QR Code Generation**
   - System automatically generates a unique QR code for each session
   - QR code links to the registration page for that specific session
   - QR code can be displayed on screen or downloaded
   - Acceptance criteria: QR code scannable by any standard QR reader, links to correct session
   - Priority: High

3. **Participant Registration**
   - Participants scan QR code to access registration page
   - Registration form requires only name (free text input)
   - No email, password, or account creation required
   - Instant registration upon submission
   - Acceptance criteria: Name submitted, participant added to session, confirmation shown
   - Priority: High

4. **Participant List**
   - Facilitators can view all registered participants for their session
   - List updates in real-time as people register
   - Shows participant names and registration time
   - Acceptance criteria: All registered participants visible, updates automatically
   - Priority: High

5. **Session Management**
   - Facilitators can view all their sessions
   - Session workflow:
     1. **Created** - Setup questions, generate QR code
     2. **Registration Open** - Participants can register
     3. **Started** - Registration locked, participants answer questions (no time limit)
     4. **Closed** - Session ended, no more answers accepted
   - Before starting: Facilitator must set up questions
   - Facilitators can start a session after participants have registered and questions are ready
   - Facilitators control timing: manually close session when participants have had enough time
   - Started/closed sessions no longer accept new registrations
   - Once closed, participants cannot submit or modify answers
   - Acceptance criteria: List of sessions, ability to start/close session, state changes prevent new registrations, questions locked after start
   - Priority: Medium

6. **Start Session**
   - Facilitators can start the session when ready to begin the workshop
   - Starting a session locks registration (no new participants)
   - Starting transitions participants to the question answering phase
   - Clear visual indication of session state (registration vs. started)
   - Acceptance criteria: Start button available, registration locked after start, participants see questions
   - Priority: High

7. **Question Management**
   - Facilitators can manage questions before starting the session
   - Actions available: Add new question, edit question text, delete question, reorder questions
   - Target: 4-5 questions per session (flexible)
   - Questions can be:
     - Selected from a predefined template library (stored in DB), OR
     - Custom written by facilitator
   - All questions use the same answer format (select top 3 participants)
   - Questions cannot be modified after session is started (locked)
   - Acceptance criteria: Add/edit/delete/reorder questions, questions saved to session, changes blocked after session starts
   - Priority: High

8. **Pre-defined Question Templates**
   - System provides a curated library of predefined question templates authored by the MasterPeace team
   - Templates are stored in a `question_templates` database table
   - Each template has: question text, category tag, and an active/inactive flag
   - Templates are grouped by category (e.g., Leadership, Communication, Teamwork, Trust, Energy)

   **Facilitator — browsing & selecting templates:**
   - In the Questions panel (before session starts), a "Browse templates" button opens a template picker
   - The picker displays all active templates, grouped by category
   - Facilitator can select one or more templates from the picker
   - Selecting a template adds it as a new question to the session (with its text pre-filled)
   - The added question is editable — facilitator can modify the text after importing
   - If a template is already added to the session, it is shown as dimmed/checked in the picker so the facilitator knows it is already included (but can still be added again if needed)
   - The picker is a modal/drawer overlay; closing it returns to the Questions panel
   - Custom question entry (free-text) remains available alongside template selection

   **Template library management (admin only):**
   - Templates are managed by a privileged admin role, not regular facilitators
   - Admin can create, edit, and soft-delete (deactivate) templates
   - Deactivated templates are hidden from facilitators but not deleted from the database
   - Admin UI lives at `/admin/templates` (auth-gated to admin role)
   - No public-facing admin UI needed in initial scope; direct Supabase dashboard access is acceptable as a fallback

   **Data model:**
   - Table: `question_templates(id UUID PK, question_text TEXT NOT NULL, category TEXT NOT NULL, is_active BOOLEAN DEFAULT true, order_index INTEGER, created_at TIMESTAMPTZ)`
   - RLS: all authenticated users can read active templates; only admin role can insert/update/delete
   - No FK to sessions — templates are a shared library independent of any session

   **Acceptance criteria:**
   - Template picker is accessible from the Questions panel (registration_open state only)
   - All active templates are listed, grouped by category
   - Selecting a template appends it to the session's question list
   - Added template question can be edited or deleted like any custom question
   - Templates that are inactive are not shown to facilitators
   - Admin can toggle a template's active status
   - Priority: Medium

9. **Participant Assessment (Core Feature)**
   - When session starts, participants see the questions
   - For each question, participants select their top 3 choices from all registered participants
   - Answer options = list of all participant names (excluding themselves)
   - Participants can rank their 3 choices (1st, 2nd, 3rd)
   - Cannot select the same person multiple times per question
   - Must answer all questions before submitting
   - **No time limit** - participants can take as long as needed
   - Facilitator controls timing by closing the session when ready
   - Acceptance criteria: Display questions, show participant list, select top 3, validate answers, submit responses
   - Priority: High

10. **Answer Review & Editing**
   - After submitting all questions, show review page with all answers
   - Display format: Question text → Selected participants (1st, 2nd, 3rd)
   - Each question has individual "Edit" button (while session open)
   - Clicking "Edit" navigates to that specific question
   - After editing one question, returns to review page (not to next question)
   - Session status clearly visible ("Session open - you can edit" or "Session closed")
   - Once facilitator closes session, edit buttons removed/disabled
   - Answers remain visible in read-only mode after session closes
   - **Participants can only see their own answers, never aggregated results**
   - Acceptance criteria: Show all answers, individual edit buttons, navigate to specific question, lock after close
   - Priority: High

11. **Answer Collection & Tracking**
   - System records all participant responses
   - Responses linked to participant and session
   - Responses are anonymous to other participants
   - Facilitator can see real-time completion status:
     - Total participants
     - Number who completed answers
     - Number still in progress
     - Who hasn't started (by name)
   - No automatic deadline - facilitator monitors progress and closes when ready
   - Once session closed, late submissions are rejected
   - Acceptance criteria: Answers saved to database, completion tracking visible to facilitator in real-time
   - Priority: High

12. **Results Visualization - 2D Matrix (Page 1)**
   - **Only accessible to facilitator** (participants cannot see results)
   - After session closes, facilitator can view results as 2-dimensional tables
   - One matrix per question showing sociometric relationships
   - **Scoring system:**
     - 1st choice = 3 points
     - 2nd choice = 2 points
     - 3rd choice = 1 point
   - Matrix structure:
     - Rows: Participants (who answered)
     - Columns: Participants (who were selected)
     - Cells: Ranking in that selection (1, 2, or 3)
   - **Summary row for each participant (column totals):**
     - Count of 1st place selections (×3 points each)
     - Count of 2nd place selections (×2 points each)
     - Count of 3rd place selections (×1 point each)
     - **Total points** (weighted sum)
   - Shows who selected whom with point-based ranking
   - Acceptance criteria: Generate 2D matrix, show rankings, calculate counts per position, display total points
   - Priority: High

13. **Results Visualization - Relationship Graph (Page 2)**
   - **Only accessible to facilitator** (participants cannot see results)
   - Network graph showing all relationships across all questions
   - Visual elements:
     - Nodes: Participants (circles/dots)
     - Edges: Connections between participants (lines/arrows)
     - **Edge styling by ranking:**
       - 1st choice (3 pts): Bold solid line
       - 2nd choice (2 pts): Thin solid line
       - 3rd choice (1 pt): Dashed line
     - Direction: Arrows point from selector to selected
   - Interactive or static visualization
   - Shows social network structure of the group
   - Aggregates data from all questions or filterable by question
   - Acceptance criteria: Generate network graph, display participant nodes, show connections with correct line styles, visual clarity
   - Priority: High

### User Management
- **Facilitator Authentication**: Google OAuth (Sign in with Google)
- **No Participant Accounts**: Participants do not need accounts or authentication
- **Role Separation**: Clear distinction between facilitator and participant views
- **Session Ownership**: Only the creator can manage their sessions
- **First-time Login**: Facilitators automatically get account created on first Google sign-in

### Data Management

**Session Data:**
- Session ID (unique identifier)
- Session name/title
- Created by (facilitator)
- Created date/time
- Status (registration_open/started/closed)
- QR code URL
- Questions (4-5 questions)

**Participant Data:**
- Participant ID (unique)
- Name (free text)
- Session ID (which session they registered for)
- Registration timestamp
- Answer submission status (not_started/in_progress/completed)
- Optional: Device info for analytics

**Question Data:**
- Question ID
- Question text
- Session ID
- Order/sequence number

**Answer Data:**
- Answer ID
- Question ID
- Participant ID (who answered)
- Selected participants (array of 3 participant IDs)
- Rankings (1st, 2nd, 3rd choice)
- Submitted at (timestamp)
- Updated at (timestamp, for tracking edits)

**Data Retention:**
- Sessions and participant data retained for workshop duration
- Answers retained for analysis
- Consider data export for facilitators (CSV/Excel with anonymization options)

### UI/UX Requirements

**Facilitator Interface:**
- Dashboard showing all sessions
- Large, clear QR code display (projectable)
- Real-time participant counter
- Clean participant list view
- Simple session creation flow
- Question management interface
- Answer completion tracking (who submitted, who hasn't)
- Results page 1: 2D matrix tables (one per question)
- Results page 2: Network relationship graph
- Clear navigation between result views

**Participant Interface:**
- Mobile-first design (most will use phones)
- Single-screen registration (no navigation needed)
- Large, easy-to-tap input field
- Clear success confirmation after registration
- Question answering interface:
  - One question at a time OR all questions on one page
  - Easy selection of 3 people per question
  - Clear indication of how many selected
  - Ability to change selections before submitting
  - Visual ranking (1st, 2nd, 3rd) or simple selection
  - Submit button only active when all questions answered
- Post-submission review page:
  - Display all questions with submitted answers
  - Show selected participants for each question (1st, 2nd, 3rd)
  - Individual "Edit" button per question
  - Clicking "Edit" navigates to that specific question for modification
  - After editing, return to review page
  - Clear indication when session closes (edit buttons disabled/hidden)
  - Session status indicator ("Session open" or "Session closed")

**General:**
- Fast loading (< 2 seconds)
- Works on poor mobile connections
- Clear error messages
- No complex instructions needed

## Non-Functional Requirements

### Performance
- Registration page loads in < 2 seconds
- Question answering page loads in < 2 seconds
- Real-time updates with < 1 second delay
- Support 50-100 simultaneous registrations without lag
- Support 50-100 simultaneous participants answering questions
- QR code generation instant (< 500ms)
- Smooth scrolling through participant lists (even with 100 names)

### Security
- HTTPS required for all connections
- Google OAuth for facilitator authentication (secure, no password storage)
- Session IDs must be unguessable (UUID or similar)
- Basic rate limiting to prevent spam registrations
- Input sanitization to prevent XSS attacks
- No sensitive personal data collected from participants
- Facilitator email stored securely via Supabase Auth
- **Results visibility**: Only facilitators can access aggregated results and visualizations
- Participants can only see their own individual answers, never others' responses or results

### Accessibility
- Mobile responsive (works on all screen sizes)
- Touch-friendly buttons (min 44x44px tap targets)
- High contrast text for readability
- Works without JavaScript as fallback (if possible)

### Browser Support
- Modern mobile browsers (iOS Safari, Chrome, Samsung Internet)
- Desktop browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Progressive enhancement approach
- Tailwind CSS utility-first styling for consistent cross-browser design

## Offline / Paper Fallback

### Context
Some participants may be unable to use the app during the workshop (device issues, no smartphone, connectivity problems). These participants complete the assessment on paper. The facilitator registers them manually so they are fully part of the session — appearing as answer options for all other participants — and later enters their paper answers into the system on their behalf.

### User Stories
- As a facilitator, I want to manually register a paper participant during the registration phase, so that they appear as an answer option for all other participants.
- As a facilitator, I want to enter a paper participant's answers on their behalf after the session ends, so that their responses are included in the session results.

### Requirements

#### Registration (available from `registration_open` state)
- Facilitator can add a participant by name directly from the session management page (same as any other registration)
- The paper participant is indistinguishable from digital participants — they appear in everyone else's answer options
- No special flag or marker needed on the participant record

#### Answer Entry (available from `closed` state)
- Facilitator selects which registered participant's answers to enter
- For each question, the facilitator selects the participant's 1st, 2nd, and 3rd choices — same interface as the normal participant assessment
- Submitted answers are stored identically to digital submissions
- After all answers are submitted, `top3_results` is recomputed so results reflect the newly added data
- Acceptance criteria: Facilitator registers paper participant during registration; after session closes, facilitator enters all answers for that participant; results update after submission
- Priority: Medium

---

## Future Considerations
- Export results to CSV/Excel with raw data
- Export visualizations as images (PNG/PDF)
- Additional analytics (most selected people, influence scores, etc.)
- Comparison between questions
- Filter graph by specific questions
- Multiple facilitators per session
- Participant check-in/attendance tracking
- Anonymous participant option
- Session analytics (registration timeline, completion rate)
- SMS or email notifications
- Integration with existing workshop management tools
- Participant grouping/breakout rooms
- Post-session feedback collection
- Allow participants to skip themselves or select themselves
- Weighted scoring for 1st/2nd/3rd choices

## Implementation Status

Tracks what has been built and any implementation-specific decisions made during development.

### Implemented

#### Session Creation & Management
- Facilitator dashboard listing all sessions (`/dashboard`)
- Create new session with custom name (`/dashboard/new`)
- Session status stepper: Registration Open → Started → Closed
- Rename session inline on the session page
- Start session blocked if: zero questions added, or fewer than 5 participants registered
- Close session via "Close Session" button in Session Controls

#### QR Code
- Full-screen QR code page at `/session/[sessionId]/qr` (projectable)
- Registration link displayed and copyable on the session page

#### Participant Registration (`/register/[sessionId]`)
- Name-only registration, no account required
- Participant identity persisted in `localStorage` keyed by session ID
- Registered participants can rename themselves before the session starts
- Real-time status: page detects session start via Supabase Realtime (no reload needed)
- If session already started and participant is **not** registered: shows "Session has started" message
- If session is `closed`: static "Session is closed" screen (server-rendered)

#### Question Management
- Add, edit, delete questions on the session page
- Questions ordered by `order_index`
- Questions cannot be modified once session status is `started`

#### Participant Assessment (Feature — March 2026)
- Implemented in `src/app/register/[sessionId]/AnswerQuestions.tsx`
- Triggered automatically when session status transitions to `started` (via Supabase Realtime subscription on the `sessions` table — zero page reload required)
- **One question at a time** with a progress bar showing completion
- **Ordered selection**: participants pick 1st, 2nd, 3rd choices in sequence
  - Clicking a participant assigns the next available rank
  - Clicking a ranked participant removes them (remaining ranks shift up)
  - Badge on each card shows "1st", "2nd", or "3rd"
  - Instructional text updates per step: "Pick your 1st choice" → "2nd" → "3rd"
- Answer options = all registered participants **excluding the answering participant**
- Answers stored in `public.answers` table: `selected_participant_1` = 1st choice, `selected_participant_2` = 2nd, `selected_participant_3` = 3rd
- **Resume support**: on page load, already-answered questions are fetched and skipped; participant resumes from the first unanswered question
- After all questions answered: "All done!" completion screen

### Pending / Not Yet Implemented
- Pre-defined question template library (Feature #8) — `question_templates` table, template picker in QuestionsPanel, admin management UI
- Answer review & editing after submission (Feature #10)
- Completion tracking for facilitator — who has/hasn't submitted (Feature #11)
- Results: 2D sociometric matrix (Feature #12)
- Results: Relationship network graph (Feature #13)
- **Participant results summary** (post-close): once a session is closed, participants see a limited results view — top 3 selected participants per question, without revealing who selected them

---

## Out of Scope
- Complex user profiles or social features
- Payment processing
- Email/SMS authentication for participants
- Video conferencing integration
- Mobile native apps (web-only for now)
- Multi-language support (English only initially)
- Participant-to-participant communication
- Content management for workshop materials
- **Participant access to facilitator-level results** (who selected whom, full matrices, and relationship graphs are facilitator-only)
- Public results sharing or leaderboards
