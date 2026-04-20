# 🧾 Contract Automation SaaS — Database & Auth Documentation

> Stack: React + Vite + TypeScript + Tailwind · Go + Gin · Supabase (PostgreSQL) · PandaDoc API

---

## 📑 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Google OAuth Setup](#google-oauth-setup)
- [Supabase Auth Flow](#supabase-auth-flow)
- [Database Schema](#database-schema)
- [Row Level Security](#row-level-security)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)

---

## 🏗️ Architecture Overview

```
User (Browser)
     │
     ▼
React Frontend (Vite + TS + Tailwind)
     │  signInWithGoogle()  ──────────────────────────────┐
     │  supabase.auth.getSession()                        │
     ▼                                                    ▼
Go Backend (Gin)                                  Supabase Auth
     │  Authorization: Bearer <JWT>                      │
     │  service_role_key                                 │
     ▼                                                    │
Supabase Database (PostgreSQL)  ◄───────────────────────┘
     │
     ▼
PandaDoc API (Document Engine)
```

---

## 🔐 Google OAuth Setup

### 1. Google Cloud Console

| Step | Action |
|------|--------|
| 1 | Go to [console.cloud.google.com](https://console.cloud.google.com) |
| 2 | Create a new project |
| 3 | APIs & Services → OAuth Consent Screen → External |
| 4 | Add scopes: `openid`, `email`, `profile` |
| 5 | APIs & Services → Credentials → OAuth 2.0 Client ID |
| 6 | Application type: **Web application** |
| 7 | Add Authorized Redirect URI (see below) |
| 8 | Copy **Client ID** and **Client Secret** |

### 2. Authorized Redirect URIs

```
# Supabase callback (required)
https://<your-project-ref>.supabase.co/auth/v1/callback

# Local development
http://localhost:5173
http://localhost:3000

# Production (add when deploying)
https://yourdomain.com
```

### 3. Authorized JavaScript Origins

```
http://localhost:5173
http://localhost:3000
https://yourdomain.com
```

### 4. Connect to Supabase

```
Supabase Dashboard
  → Authentication
  → Providers
  → Google
  → Paste Client ID + Client Secret
  → Save
```

---

## 🔄 Supabase Auth Flow

```
1. User clicks "Sign in with Google"
        │
        ▼
2. supabase.auth.signInWithOAuth({ provider: 'google' })
        │
        ▼
3. Redirects to Google consent screen
        │
        ▼
4. Google redirects to Supabase callback URL
        │
        ▼
5. Supabase creates session → returns JWT token
        │
        ▼
6. Frontend stores session via onAuthStateChange()
        │
        ▼
7. Frontend sends JWT in every API request:
   Authorization: Bearer <supabase_jwt>
        │
        ▼
8. Go backend validates JWT using SUPABASE_JWT_SECRET
        │
        ▼
9. Backend upserts user into public.users table
        │
        ▼
10. User lands on Dashboard ✅
```

---

## 🗄️ Database Schema

### `public.users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `google_id` | `text` | Unique Google user ID |
| `email` | `text` | Unique, not null |
| `name` | `text` | Display name |
| `avatar_url` | `text` | Google profile picture |
| `pandadoc_access_token` | `text` | AES-256 encrypted by Go backend |
| `pandadoc_refresh_token` | `text` | AES-256 encrypted by Go backend |
| `pandadoc_connected` | `boolean` | Default: false |
| `created_at` | `timestamptz` | Auto-set on insert |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

### `public.contracts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | Foreign key → `users.id` |
| `recipient_name` | `text` | Contract recipient |
| `recipient_email` | `text` | Recipient email |
| `ctc` | `text` | Encrypted before storing |
| `pandadoc_document_id` | `text` | PandaDoc document reference |
| `pandadoc_template_id` | `text` | Template used to create doc |
| `document_url` | `text` | Link to signed document |
| `status` | `text` | `draft` / `sent` / `viewed` / `completed` / `declined` |
| `created_at` | `timestamptz` | Auto-set on insert |
| `updated_at` | `timestamptz` | Auto-updated via trigger |
| `signed_at` | `timestamptz` | Set when status = completed |

### SQL — Create Tables

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id                      uuid primary key default uuid_generate_v4(),
  google_id               text unique,
  email                   text unique not null,
  name                    text,
  avatar_url              text,
  pandadoc_access_token   text,
  pandadoc_refresh_token  text,
  pandadoc_connected      boolean default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Contracts table
create table public.contracts (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.users(id) on delete cascade not null,
  recipient_name        text not null,
  recipient_email       text not null,
  ctc                   text,
  pandadoc_document_id  text,
  pandadoc_template_id  text,
  document_url          text,
  status                text default 'draft'
                        check (status in ('draft','sent','viewed','completed','declined')),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  signed_at             timestamptz
);

-- Indexes
create index idx_contracts_user_id       on public.contracts(user_id);
create index idx_contracts_status        on public.contracts(status);
create index idx_contracts_pandadoc_id   on public.contracts(pandadoc_document_id);

-- Auto-update trigger for updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated
  before update on public.users
  for each row execute function update_updated_at();

create trigger trg_contracts_updated
  before update on public.contracts
  for each row execute function update_updated_at();
```

---

## 🔒 Row Level Security

RLS ensures users can only access their own data. Even if someone has the anon key, they cannot read another user's contracts.

```sql
-- Enable RLS
alter table public.users     enable row level security;
alter table public.contracts enable row level security;

-- Users: read and update own profile only
create policy "users: read own"   on public.users
  for select using (auth.uid() = id);

create policy "users: update own" on public.users
  for update using (auth.uid() = id);

-- Contracts: full access to own contracts only
create policy "contracts: read own"   on public.contracts
  for select using (auth.uid() = user_id);

create policy "contracts: insert own" on public.contracts
  for insert with check (auth.uid() = user_id);

create policy "contracts: update own" on public.contracts
  for update using (auth.uid() = user_id);

create policy "contracts: delete own" on public.contracts
  for delete using (auth.uid() = user_id);
```

> **Note:** The Go backend uses the `service_role` key which bypasses RLS. Use it carefully and only server-side.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret

# Encryption (AES-256 — generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-key

# Server
PORT=8080
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:8080
```

### Where to find each key

| Key | Location in Supabase |
|-----|---------------------|
| `SUPABASE_URL` | Settings → API Keys → Project URL |
| `SUPABASE_ANON_KEY` | Settings → API Keys → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API Keys → service_role |
| `SUPABASE_JWT_SECRET` | Settings → JWT Keys → JWT Secret |

---

## 🛡️ Security Notes

| Rule | Detail |
|------|--------|
| Never commit `.env` | Add `.env` to `.gitignore` immediately |
| Anon key is safe for frontend | RLS policies protect the data |
| Service role key — backend only | Bypasses RLS — never expose to browser |
| JWT secret — backend only | Used to validate Supabase session tokens |
| Encrypt PandaDoc tokens | Use AES-256 in Go before writing to DB |
| Encryption key backup | If lost, all PandaDoc connections break — store in a password manager |
| Use different keys per environment | Dev and production must have separate keys |

### What is never stored in the database

```
❌ Contract content or document text
❌ PandaDoc tokens in plaintext
❌ User CTC in plaintext
❌ Any sensitive fields unencrypted
```

### What IS stored

```
✅ user_id, email, name (from Google)
✅ pandadoc_document_id (reference only)
✅ contract status + timestamps
✅ encrypted tokens (AES-256 by Go backend)
```

---

## 📦 Key Dependencies

### Backend (Go)
```
github.com/gin-gonic/gin        — HTTP framework
github.com/joho/godotenv        — .env loading
github.com/golang-jwt/jwt/v5    — JWT validation
```

### Frontend (React)
```
@supabase/supabase-js   — Supabase client + auth
axios                   — API calls to Go backend
```

---

*Last updated: April 2026*