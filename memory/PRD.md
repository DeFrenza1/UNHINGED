# Unhinged - Dating App PRD

## Original Problem Statement
Build a dating app similar to Hinge where users are matched by their red flags and negative qualities and encouraged to upload bad photos. The name of the app is Unhinged.

## User Choices
- **Core Features**: All features (profile creation with red flags, bad photo uploads, matching by complementary red flags, chat/messaging)
- **Matching Logic**: Complementary red flags (opposites attract)
- **Authentication**: Both JWT-based custom auth AND Emergent-managed Google social login
- **Design**: Combined parody of clean dating apps + neon/retro aesthetic
- **AI Features**: Roasts, icebreakers, compatibility analysis

## User Personas
1. **The Self-Aware Chaos Agent** (18-25): Young adults who embrace their flaws humorously, active on TikTok/memes
2. **The Burned-Out Dater** (25-35): Tired of polished dating apps, wants authentic connections
3. **The Satirist** (22-30): Enjoys irony and anti-establishment humor

## Core Requirements
- User registration/login (JWT + Google OAuth)
- Profile creation with red flags and negative qualities
- Bad photo uploads with "worst photo" challenges
- Matching algorithm based on complementary red flags
- Swipe/like/pass on profiles
- Chat/messaging between matches
- AI-generated roasts and icebreakers

## What's Been Implemented (December 2025)
### Backend (FastAPI + MongoDB)
- [x] JWT authentication with bcrypt password hashing
- [x] Google OAuth integration via Emergent Auth
- [x] User profile CRUD with red flags, negative qualities, photos
- [x] Profile completeness tracking
- [x] Discovery feed (excludes already-swiped profiles)
- [x] Swipe system (like/pass) with mutual match detection
- [x] Match management
- [x] Real-time-ish messaging
- [x] AI roast generation (GPT-4o via Emergent LLM Key)
- [x] AI compatibility analysis
- [x] AI icebreaker generation
- [x] Red flag & prompt suggestions API

### Frontend (React + Tailwind + Shadcn)
- [x] Landing page with neon/brutalist aesthetic
- [x] Registration with email/password
- [x] Login with email/password + Google OAuth
- [x] 4-step profile setup wizard
- [x] Discovery feed with swipe UI
- [x] Match modal on mutual likes
- [x] Matches list
- [x] Chat interface with AI icebreaker generation
- [x] Settings page with AI roast feature
- [x] Profile editing

### Design
- [x] Neon Retro x Neubrutalism aesthetic
- [x] Space Mono & JetBrains Mono typography
- [x] Dark theme (#050505 background)
- [x] Neon green (#39FF14) & magenta (#FF00FF) accents
- [x] Hard shadows, visible borders, brutalist components
- [x] Scanline & noise texture effects

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Image upload to cloud storage (currently URL-based)
- [ ] Push notifications for new matches/messages
- [ ] Rate limiting for swipes

### P1 (High Priority)
- [ ] Profile photo carousel in discovery
- [ ] Unmatch functionality
- [ ] Block/report users
- [ ] Profile verification system

### P2 (Medium Priority)
- [ ] Location-based matching
- [ ] Advanced filters (age range, distance)
- [ ] Match expiration (conversation starters)
- [ ] Daily "red flag of the day" prompts

### P3 (Nice to Have)
- [ ] Share profile as meme card
- [ ] Leaderboard of "most red flagged" users (opt-in)
- [ ] Group chats for matched groups
- [ ] Voice messages in chat

## Next Tasks
1. Add cloud image upload (S3/Cloudinary)
2. Implement push notifications
3. Add match expiration feature
4. Create shareable profile cards for viral growth

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor, PyJWT, BCrypt
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, Axios
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Auth**: JWT + Emergent Google OAuth
