# Architecture

## Overview
*High-level description of the system architecture*

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (for buttons, forms, dialogs, etc.)
- **State Management**: React hooks + Supabase client
- **Icons**: Lucide React (included with Shadcn)
- **QR Code**: qrcode.react
- **Network Graph Visualization**: vis-network (via react-vis-network)
- **Matrix Table**: HTML Table + Tailwind CSS (or TanStack Table for advanced features)

### Backend
- **API**: Next.js API Routes + Supabase Client
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth (for facilitators)
- **Real-time**: Supabase Realtime (for live participant updates)
- **File Storage**: Supabase Storage (if needed for exports)

### Infrastructure
- **Hosting**: Vercel (recommended for Next.js)
- **Database**: Supabase Cloud
- **CI/CD**: Vercel Git integration
- **Monitoring**: Vercel Analytics + Supabase Dashboard

## System Architecture

### Application Structure
```
┌─────────────────┐
│  Participant    │ (Mobile Browser)
│    Device       │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Next.js App   │ (Vercel)
│  - App Router   │
│  - API Routes   │
└────────┬────────┘
         │
         │ Supabase Client
         ▼
┌─────────────────┐
│   Supabase      │
│  - PostgreSQL   │
│  - Realtime     │
│  - Auth         │
└─────────────────┘
```

### Data Flow
*How data moves through the system*

### Key Components

#### Frontend Components

**Facilitator Components:**
- AuthButton - Google Sign In button
- SessionDashboard - List and manage sessions
- SessionCreator - Create new session with questions
- QRCodeDisplay - Large QR code for projection
- ParticipantTracker - Real-time registration and completion status
- ResultsMatrix - 2D table visualization per question
- ResultsGraph - Network graph visualization
- QuestionManager - Add/edit/reorder questions

**Participant Components:**
- Registration - Simple name input form
- QuestionAnswering - Question list with participant selection
- AnswerReview - Display all submitted answers with edit buttons
- QuestionEdit - Edit single question and return to review
- SessionStatus - Show if session is open or closed

#### Backend Services
*API endpoints, services, and their responsibilities*

#### Database Schema (Supabase/PostgreSQL)

**Tables:**

```sql
-- Facilitators (uses Supabase Auth)
-- Managed by Supabase Auth system

-- Question Templates (predefined questions)
question_templates
  - id (uuid, primary key)
  - question_text (text)
  - category (text, e.g., 'leadership', 'communication', 'teamwork')
  - created_at (timestamp)
  - is_active (boolean)

-- Sessions
sessions
  - id (uuid, primary key)
  - facilitator_id (uuid, foreign key to auth.users)
  - name (text)
  - status (enum: created, registration_open, started, closed)
  - qr_code_url (text)
  - created_at (timestamp)
  - started_at (timestamp, nullable)
  - closed_at (timestamp, nullable)

-- Questions (specific to each session)
questions
  - id (uuid, primary key)
  - session_id (uuid, foreign key to sessions)
  - question_text (text)
  - order_index (integer)
  - template_id (uuid, foreign key to question_templates, nullable)
  - created_at (timestamp)

-- Participants
participants
  - id (uuid, primary key)
  - session_id (uuid, foreign key to sessions)
  - name (text)
  - answer_status (enum: not_started, in_progress, completed)
  - registered_at (timestamp)
  - submitted_at (timestamp, nullable)

-- Answers
answers
  - id (uuid, primary key)
  - question_id (uuid, foreign key to questions)
  - participant_id (uuid, foreign key to participants)
  - selected_participant_1 (uuid, foreign key to participants)
  - selected_participant_2 (uuid, foreign key to participants)
  - selected_participant_3 (uuid, foreign key to participants)
  - created_at (timestamp)
```

**Indexes:**
- session_id on participants, questions, answers
- facilitator_id on sessions
- participant_id on answers

**Row Level Security (RLS):**
- Facilitators can only access their own sessions
- Participants can only view other participants' names in their session (for selection)
- Participants can only view their own answers (not others' answers)
- **Aggregated results (matrix, graphs) are only accessible to facilitators**
- Individual answers are only visible to the facilitator and the participant who submitted them

## Design Patterns

### State Management
*How application state is managed*

### Data Fetching
- **Server Components**: Fetch data directly from Supabase in React Server Components
- **Client Components**: Use Supabase client for real-time subscriptions
- **Real-time Updates**:
  - Participant list updates via Supabase Realtime
  - Answer completion status via Supabase Realtime
- **Caching**: Next.js automatic caching for static data
- **Optimistic Updates**: For better UX when submitting answers

### Error Handling
*How errors are caught and displayed*

### Authentication Flow

**Facilitator Authentication (Google OAuth):**
1. Facilitator clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. User approves access
4. Google redirects back to app with authorization code
5. Supabase exchanges code for JWT token
6. Token stored in httpOnly cookie
7. Next.js middleware validates token
8. Server components access user session
9. User profile (email, name) stored in Supabase Auth users table

**Participant "Authentication":**
1. Participant scans QR code → lands on registration page with session_id
2. Submits name → creates participant record
3. Returns unique participant_id (stored in localStorage/cookie)
4. Uses participant_id for subsequent requests (answering questions)
5. No password required

## Security Considerations
*Security measures and best practices*

## Performance Optimization
*Strategies for optimal performance*
- Code splitting
- Lazy loading
- Caching strategy
- Image optimization

## Scalability
*How the system can scale as it grows*

## Third-Party Integrations
*External services and APIs used*
