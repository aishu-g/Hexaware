-- ========================================================
-- SurvIntel Platform — Initial Database Migration Schema
-- ========================================================

-- Enable required UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (User profiles linked to auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text,
    role text not null default 'supervisor' check (role in ('admin', 'hsd_officer', 'supervisor', 'viewer')),
    department text default 'National Sample Survey Office (NSSO)',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS Policies
create policy "Allow authenticated users to read all profiles"
    on public.profiles for select
    to authenticated
    using (true);

create policy "Allow users to update their own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id);

create policy "Allow admins to manage profiles"
    on public.profiles for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- 2. SURVEY BATCHES TABLE
create table if not exists public.survey_batches (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    survey_type text not null default 'PLFS',
    survey_round text not null default '2023-Q4',
    total_households integer default 0,
    total_individuals integer default 0,
    status text not null default 'pending' check (status in ('pending', 'validating', 'completed', 'failed')),
    ingested_by uuid references public.profiles(id) on delete set null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

alter table public.survey_batches enable row level security;

create policy "Authenticated users can read survey batches"
    on public.survey_batches for select
    to authenticated
    using (true);

create policy "Authorized users can insert survey batches"
    on public.survey_batches for insert
    to authenticated
    with check (true);

create policy "Authorized users can update survey batches"
    on public.survey_batches for update
    to authenticated
    using (true);

-- 3. HOUSEHOLDS TABLE
create table if not exists public.households (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.survey_batches(id) on delete cascade,
    hh_id text not null,
    state text not null,
    district text not null,
    psu_id text not null,
    sector text not null check (sector in ('rural', 'urban')),
    hh_size integer not null default 1,
    religion text,
    social_group text,
    monthly_expenditure numeric default 0,
    land_owned_hectares numeric default 0,
    enumerator_id text not null,
    response_time_seconds numeric default 0,
    created_at timestamptz default now()
);

alter table public.households enable row level security;

create policy "Authenticated users can read households"
    on public.households for select
    to authenticated
    using (true);

create policy "Authorized users can insert households"
    on public.households for insert
    to authenticated
    with check (true);

-- 4. INDIVIDUALS TABLE
create table if not exists public.individuals (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.survey_batches(id) on delete cascade,
    household_id uuid not null references public.households(id) on delete cascade,
    person_id text not null,
    age integer not null,
    sex integer not null,
    general_education integer not null,
    marital_status integer not null,
    principal_activity_status integer not null,
    subsidiary_activity_status integer default 0,
    weekly_earnings numeric default 0,
    hours_worked numeric default 0,
    created_at timestamptz default now()
);

alter table public.individuals enable row level security;

create policy "Authenticated users can read individuals"
    on public.individuals for select
    to authenticated
    using (true);

create policy "Authorized users can insert individuals"
    on public.individuals for insert
    to authenticated
    with check (true);

-- 5. VALIDATION RULES TABLE
create table if not exists public.validation_rules (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    title text not null,
    description text not null,
    level text not null check (level in ('record', 'cluster', 'aggregate')),
    severity text not null check (severity in ('hard', 'soft')),
    entity text not null check (entity in ('household', 'individual', 'aggregate')),
    condition_expression text not null,
    is_active boolean default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.validation_rules enable row level security;

create policy "Authenticated users can view validation rules"
    on public.validation_rules for select
    to authenticated
    using (true);

create policy "Admins and HSD Officers can manage validation rules"
    on public.validation_rules for all
    to authenticated
    using (true);

-- 6. ANOMALIES TABLE
create table if not exists public.anomalies (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.survey_batches(id) on delete cascade,
    rule_id uuid references public.validation_rules(id) on delete set null,
    rule_code text not null,
    level text not null check (level in ('record', 'cluster', 'aggregate')),
    severity text not null check (severity in ('hard', 'soft')),
    household_id uuid references public.households(id) on delete cascade,
    individual_id uuid references public.individuals(id) on delete cascade,
    enumerator_id text,
    psu_id text,
    district text,
    state text,
    score numeric default 1.0,
    reason_text text not null,
    details jsonb default '{}'::jsonb,
    status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'false_positive')),
    reviewed_by uuid references public.profiles(id) on delete set null,
    reviewer_notes text,
    resolved_at timestamptz,
    created_at timestamptz default now()
);

alter table public.anomalies enable row level security;

create policy "Authenticated users can view anomalies"
    on public.anomalies for select
    to authenticated
    using (true);

create policy "Authorized users can insert anomalies"
    on public.anomalies for insert
    to authenticated
    with check (true);

create policy "Supervisors and Officers can update anomaly resolution status"
    on public.anomalies for update
    to authenticated
    using (true);

-- 7. ENUMERATOR METRICS TABLE
create table if not exists public.enumerator_metrics (
    id uuid primary key default gen_random_uuid(),
    enumerator_id text not null,
    batch_id uuid not null references public.survey_batches(id) on delete cascade,
    psu_id text not null,
    total_households_surveyed integer default 0,
    flagged_anomalies_count integer default 0,
    avg_response_time_seconds numeric default 0,
    risk_score numeric default 0.0,
    is_outlier boolean default false,
    metrics_json jsonb default '{}'::jsonb,
    updated_at timestamptz default now(),
    unique (enumerator_id, batch_id)
);

alter table public.enumerator_metrics enable row level security;

create policy "Authenticated users can view enumerator metrics"
    on public.enumerator_metrics for select
    to authenticated
    using (true);

create policy "Authorized users can insert and update enumerator metrics"
    on public.enumerator_metrics for all
    to authenticated
    using (true);

-- 8. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    action text not null,
    target_type text not null,
    target_id text,
    details jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Authenticated users can view audit logs"
    on public.audit_logs for select
    to authenticated
    using (true);

create policy "Authorized users can insert audit logs"
    on public.audit_logs for insert
    to authenticated
    with check (true);

-- Indexes for fast query performance
create index if not exists idx_households_batch on public.households(batch_id);
create index if not exists idx_households_enum on public.households(enumerator_id);
create index if not exists idx_individuals_hh on public.individuals(household_id);
create index if not exists idx_anomalies_batch on public.anomalies(batch_id);
create index if not exists idx_anomalies_status on public.anomalies(status);
create index if not exists idx_anomalies_severity on public.anomalies(severity);
create index if not exists idx_enum_metrics_batch on public.enumerator_metrics(batch_id);
