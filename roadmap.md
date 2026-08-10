# Eisenhower Todo - Full-Stack Roadmap

This project is evolving from a client-side prototype to a full-stack SaaS application with authentication and persistent database storage.

## Phase 1: Setup Backend & Database
- Install mongoose and next-auth.
- Configure MongoDB connection (lib/mongodb.ts).
- Define User and Task Mongoose schemas (models/User.ts, models/Task.ts).

## Phase 2: Implement Authentication
- Configure NextAuth.js (setup providers like Google/GitHub/Email).
- Protect dashboard routes using NextAuth session handling.

## Phase 3: Migrations & Backend Integration
- Implement Server Actions for Task CRUD operations (fetch, create, update, delete).
- Refactor dashboard to fetch tasks from the API instead of relying on local useState.
- Ensure users can only access their own tasks based on their authentication session.
