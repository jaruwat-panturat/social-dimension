# Claude Context: Social Dimension

## Project Overview
Social Dimension is a web application built with React/Next.js, part of the MasterPeace project suite.

## Documentation
For detailed project specifications, refer to:
- **[Requirements](./docs/requirements.md)** - Feature requirements and user stories
- **[Architecture](./docs/architecture.md)** - Technical architecture and design decisions
- **[API Specification](./docs/api-spec.md)** - API endpoints and data contracts

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (optional, recommended)
- **State Management**: React hooks + Supabase client
- **Hosting**: Vercel

## Project Structure
```
social-dimension/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # Reusable React components
│   ├── lib/          # Utility functions and helpers
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
└── tests/            # Test files
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Prefer named exports for components

### Component Organization
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Co-locate related files (component, styles, tests)

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)

## Key Features
*To be defined as the project evolves*

## Notes for Claude
- Always ask for clarification when requirements are unclear
- Suggest best practices for React/Next.js development
- Consider performance implications (lazy loading, memoization, etc.)
- Ensure accessibility (a11y) standards are met
- Keep dependencies minimal and well-maintained
