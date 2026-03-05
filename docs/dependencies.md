# Project Dependencies

## Core Dependencies

### Framework & Language
```bash
npm install next@14 react@18 react-dom@18 typescript
npm install -D @types/node @types/react @types/react-dom
```

### Styling
```bash
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/forms
npx tailwindcss init -p
```

### UI Components (Shadcn UI)
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
```

## Database & Auth

### Supabase
```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Visualization Libraries

### Network Graph
```bash
npm install vis-network react-vis-network
npm install -D @types/vis-network
```

**Purpose:** Social network relationship graph
- Force-directed layout
- Custom line styles (bold/thin/dashed)
- Node sizing based on popularity

### QR Code Generation
```bash
npm install qrcode.react
npm install -D @types/qrcode.react
```

**Purpose:** Generate QR codes for session registration

## Optional Dependencies

### Table Management (if needed)
```bash
npm install @tanstack/react-table
```

**Purpose:** Advanced table features (sorting, filtering) for matrix view
- Only install if basic HTML table is insufficient

## Development Dependencies

### ESLint & Prettier
```bash
npm install -D eslint eslint-config-next prettier prettier-plugin-tailwindcss
```

## Package.json Summary

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.0.10",
    "vis-network": "^9.1.9",
    "react-vis-network": "^1.0.0",
    "qrcode.react": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/vis-network": "^9.1.0",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "^14.1.0",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.9",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

## Installation Order

1. **Core framework:**
   ```bash
   npm install
   ```

2. **Tailwind CSS:**
   ```bash
   npx tailwindcss init -p
   ```

3. **Shadcn UI:**
   ```bash
   npx shadcn-ui@latest init
   ```

4. **Additional libraries:**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr vis-network react-vis-network qrcode.react
   ```

## Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Notes

- All dependencies use latest stable versions
- Tailwind CSS configured for Next.js App Router
- Shadcn UI provides headless components styled with Tailwind
- vis-network chosen for network graph visualization
- Supabase handles database, auth, and realtime
- Only facilitators can access results endpoints
