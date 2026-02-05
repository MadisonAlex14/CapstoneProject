# CapstoneProject

A full-stack web application built with Next.js (frontend) and Supabase Edge Functions (backend). This project uses a monorepo structure with separate frontend and backend directories.

## Table of Contents
- [How to Run](#how-to-run)
- [Project Structure](#project-structure)
- [How to Extend](#how-to-extend)
- [Building New Features](#building-new-features)

## How to Run

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd CapstoneProject
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Create environment file**
   - Create a `.env.local` file in the `frontend/` directory (NOT root)
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Get these values from your Supabase project: Settings → API

5. **Run the frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   - App will be available at `http://localhost:3000`

6. **Run backend functions locally (optional)**
   ```bash
   cd backend
   npx supabase functions serve
   ```
   - This serves functions locally for testing, I had a hard time doing this so I opt to just push changes to the functions using npx supabase functions deploy --no-verify-jwt

## Project Structure

```
CapstoneProject/
├── frontend/                    # Next.js React application
│   ├── src/
│   │   ├── app/               # App router pages (UI routes)
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── login/
│   │   │   │   └── page.tsx   # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx   # Signup page
│   │   └── components/        # Reusable React components
│   ├── .env.local             # Environment variables (NOT tracked in git)
│   └── package.json
│
├── backend/                     # Supabase Edge Functions
│   ├── supabase/
│   │   └── functions/         # Serverless functions
│   │       ├── login/         # Login function
│   │       │   ├── index.ts
│   │       │   └── deno.json
│   │       └── signup/        # Signup function
│   │           ├── index.ts
│   │           └── deno.json
│   └── package.json
│
├── .gitignore                   # Global git ignore rules
└── README.md
```

### Frontend Structure Details
- **`src/app/`** - Next.js App Router pages (routes mapped to URLs)
- **`src/components/`** - Reusable React UI components
- **Business Logic** - Place API calls, data fetching, and state management here (separate from UI components)
- **Styling** - CSS modules or Tailwind (configured in project)

### Backend Structure Details
- **`backend/supabase/functions/`** - Each folder is a serverless function
- **Function Naming** - Use descriptive names (e.g., `login`, `signup`, `get-user-data`)
- **No database models or migrations here** - Database RLS policies handle security

## How to Extend

### Git Workflow

1. **Create a feature branch from `staging`**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feat/JIRA-123  # For features
   git checkout -b bug/JIRA-456   # For bug fixes
   git checkout -b hotfix/JIRA-789 # For hotfixes
   ```

2. **Branch naming convention**: `(feat|bug|hotfix)/TICKET_NUMBER`
   - Example: `feat/JIRA-42`, `bug/JIRA-88`, `hotfix/JIRA-15`
   - Use the Jira ticket number in your branch name

3. **Make your changes** on your personal branch

4. **Commit and push**
   ```bash
   git add .
   git commit -m "JIRA-123: Description of changes"
   git push origin feat/JIRA-123
   ```

5. **Create a Pull Request**
   - Push to `staging` branch (NOT main/master)
   - Request code review
   - Once approved, merge to `staging`

6. **Never commit directly to `staging` or `main`**

## Building New Features

### Architecture Overview
- **Backend** = Supabase Edge Functions (serverless API endpoints)
- **Frontend** = Next.js with React (UI + business logic)
- **Database Security** = RLS policies (Row Level Security) on Supabase

### Workflow for Adding a New Feature

#### 1. Backend: Create a New Serverless Function

Create a new function in `backend/supabase/functions/`:

```bash
cd backend
mkdir -p supabase/functions/my-feature
```

Create `backend/supabase/functions/my-feature/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Your function logic here
  return new Response(
    JSON.stringify({ message: "Success" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

Create `backend/supabase/functions/my-feature/deno.json`:
```json
{
  "imports": {
    "supabase-js": "npm:@supabase/supabase-js@2"
  }
}
```

#### 2. Deploy the Function

```bash
cd backend
npx supabase functions deploy my-feature --no-verify-jwt
```

**Why `--no-verify-jwt`?**
- We rely on Supabase RLS (Row Level Security) for security
- RLS policies on the database enforce who can access what
- This allows the function to handle both authenticated and unauthenticated requests

#### 3. Frontend: Create UI and Call the Function

**For UI components** - Create in `frontend/src/app/` or `frontend/src/components/`:
```typescript
// frontend/src/app/my-feature/page.tsx
"use client";

import { useState } from "react";

export default function MyFeaturePage() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/functions/v1/my-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "value" }),
      });
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>My Feature</h1>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Loading..." : "Execute"}
      </button>
    </div>
  );
}
```

**For business logic** - Create utility files in `frontend/src/`:
```typescript
// frontend/src/utils/api.ts
export async function callMyFeature(data: any) {
  const response = await fetch("/functions/v1/my-feature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

Then import and use in your components:
```typescript
import { callMyFeature } from "@/utils/api";

// In your component:
const result = await callMyFeature({ ...data });
```

### File Organization Guide

| File Type | Location | Purpose |
|-----------|----------|---------|
| Serverless functions | `backend/supabase/functions/*/index.ts` | API endpoints |
| React pages | `frontend/src/app/*/page.tsx` | Route handlers |
| React components | `frontend/src/components/*.tsx` | Reusable UI components |
| API utilities | `frontend/src/utils/*.ts` | API call helpers, business logic |
| Styles | `frontend/src/app/*.css` or component files | Styling |
| Types | `frontend/src/types/*.ts` | TypeScript interfaces/types |

### Deployment

**Frontend:**
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or your hosting
```

**Backend:**
```bash
cd backend
npx supabase functions deploy my-feature --no-verify-jwt
```

### Security Notes
- RLS policies enforce data access at the database level
- Frontend should validate user input before calling functions
- Never commit `.env.local` or `.env` files (they're in `.gitignore`)
- Keep Supabase keys secure and rotate regularly