# Skill Connect (SkillSwap)

Skill Connect is a React + TypeScript web app for peer-to-peer skill exchange.  
Users create profiles, add skills they can teach and want to learn, discover mutual matches, request learning sessions, take quizzes, and track ratings.

## Features

- **Authentication** (sign up/sign in) with Supabase Auth
- **Profile management** with bio and verification document uploads
- **Skill listing** for “I can teach” and “I want to learn”
- **Mutual matching** based on complementary skills
- **Session requests** and status tracking (pending/accepted/rejected/completed)
- **Quiz workflow** for skill assessment
- **Ratings & feedback** and a public leaderboard
- **In-app notifications** for key user events

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui, Radix UI, Framer Motion
- **Data & Auth:** Supabase
- **State/Data fetching:** React Query
- **Testing:** Vitest, Testing Library

## Project Structure

- `src/pages` – app pages (auth, dashboard, skills, matches, sessions, quizzes, etc.)
- `src/components` – reusable UI and layout components
- `src/contexts` – auth/session context
- `src/integrations` – external service clients (Supabase)
- `src/types` – shared TypeScript types

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
cd skill-connect
npm install
```

### Run Development Server

```bash
npm run dev
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` – start development server
- `npm run build` – production build
- `npm run build:dev` – development-mode build
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint
- `npm run test` – run tests once
- `npm run test:watch` – run tests in watch mode

## Supabase Configuration

Supabase client setup is located at:

- `src/integrations/supabase/client.ts`

Update this client configuration to point to your own Supabase project when deploying your own instance.
