# SurvIntel — PLFS Microdata Integrity & ML Anomaly Detection Platform

**SurvIntel** is a modular, AI-powered survey data validation and anomaly detection platform designed for the **Periodic Labour Force Survey (PLFS)** under India's **Ministry of Statistics and Programme Implementation (MoSPI)** and the **National Sample Survey Office (NSSO)**.

SurvIntel automates raw CAPI microdata ingestion, schema validation, deterministic rule checking, Isolation Forest ML cluster anomaly detection, time-series baseline trend evaluation, and officer audit sign-offs.

---

## 🌟 Key Architecture & Features

1. **Next.js 14 App Router & TypeScript Core**:
   - Role-aware application shell with light/dark high-contrast theme engine.
   - Role-based Access Control (RBAC) & Row-Level Security (RLS) policies for `admin`, `hsd_officer`, `supervisor`, and `viewer` personas.

2. **Normalized Supabase Database Engine**:
   - `surveys`: Extensible survey metadata.
   - `survey_batches`: Ingestion batch audit logs.
   - `raw_records`: Raw staging table for batch and CAPI real-time payloads.
   - `households` & `individuals`: Normalized core microdata rosters.
   - `schedules`: Field visit schedules.
   - `check_definitions` & `check_results`: Rule engine check definitions and execution results.
   - `anomaly_scores`: ML anomaly scoring results ($0.0$ to $1.0$).
   - `profiles`: User profiles linked to Supabase Auth.

3. **Validation Rule Engine & Check Execution Engine**:
   - **Hard Checks**: Blocks invalid records (e.g., Child Labor violations, impossible age ranges).
   - **Soft Quality Flags**: Identifies statistical outliers (e.g., earnings deviation, working hour caps).
   - **Check Kinds**: Range checks, Referential integrity checks, Existential checks, and Pattern matching.

4. **Python FastAPI ML Microservice (`ml-service/`)**:
   - `/score/record`: Z-score & IQR statistical outlier detection per numeric attribute.
   - `/score/cluster`: Isolation Forest anomaly detection on per-enumerator and PSU cluster features.
   - `/score/aggregate`: Time-series baseline deviation detection vs historical seasonal trends.

5. **Audit Dossier & Multi-Format Export Engine**:
   - Filtered **CSV Export** for microdata flags.
   - Print-ready **PDF Audit Certificate** generation with NSSO branding.

---

## 🚀 Local Development Setup Guide

### 1. Prerequisites
- **Node.js** (v18.x or later) & `npm`
- **Python** 3.10+ (for ML microservice)
- **Supabase CLI** (optional for local DB migrations) or a cloud Supabase project

### 2. Environment Configuration
Copy `.env.example` to create `.env.local`:
```bash
cp .env.example .env.local
```

Ensure `.env.local` has your Supabase and ML service endpoints:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_URL=http://127.0.0.1:8000
```

### 3. Install Dependencies & Run Next.js App
```bash
# Install Node dependencies
npm install

# Run TypeScript typecheck
npm run typecheck

# Start Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🤖 Python FastAPI ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Run FastAPI service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at **http://127.0.0.1:8000/docs**.

---

## 🗄️ Supabase Database Schema Migrations

Apply the SQL migration files in sequence via the Supabase SQL Editor:

1. [`supabase/migrations/20260816_auth_profiles.sql`](file:///c:/Users/Owner/OneDrive/Desktop/Hexaware%20Hackathon/supabase/migrations/20260816_auth_profiles.sql) — User profiles, roles (`admin`, `hsd_officer`, `supervisor`, `viewer`), and RLS policies.
2. [`supabase/migrations/20260816_plfs_schema.sql`](file:///c:/Users/Owner/OneDrive/Desktop/Hexaware%20Hackathon/supabase/migrations/20260816_plfs_schema.sql) — `surveys`, `survey_batches`, `raw_records`, `households`, `individuals`, `schedules`.
3. [`supabase/migrations/20260816_check_definitions.sql`](file:///c:/Users/Owner/OneDrive/Desktop/Hexaware%20Hackathon/supabase/migrations/20260816_check_definitions.sql) — Deterministic check definitions & audit execution tables.
4. [`supabase/migrations/20260816_anomaly_scores.sql`](file:///c:/Users/Owner/OneDrive/Desktop/Hexaware%20Hackathon/supabase/migrations/20260816_anomaly_scores.sql) — ML anomaly scores table.

---

## ☁️ Deployment Instructions

### Deploying to Vercel (Frontend & Next.js API Routes)
1. Push the repository to GitHub.
2. Connect your repository in the [Vercel Dashboard](https://vercel.com).
3. Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ML_SERVICE_URL`).
4. Click **Deploy**. Vercel will automatically run `npm run build` and publish your app.

### Deploying FastAPI ML Service (Render / Railway / AWS ECS)
1. Create a Dockerfile or Python Service on Render/Railway pointing to `ml-service/`.
2. Start Command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Update `ML_SERVICE_URL` in Vercel to point to your live Python ML service URL.

---

## 🧪 Verification & Health Check

- **Health Check Status Page**: Visit `/status` on your deployed domain to confirm database connection and latency.
- **REST Real-time Ingestion API Stub**: `POST /api/ingest/realtime` accepts live CAPI survey payloads.
- **Production Build Verification**: Run `npm run build` locally to verify static page generation across all 20 routes.
