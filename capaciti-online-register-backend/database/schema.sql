-- CAPACITI Online Register: database schema for Supabase PostgreSQL 17.
--
-- This mirrors the live Supabase project (checked 2026-10-28) plus the
-- notifications table. Use it for a new project; for the existing project
-- run only the files in database/migrations. Every statement skips objects
-- that already exist, so running it again is safe.
--
-- The backend starts with spring.jpa.hibernate.ddl-auto=validate, so these
-- tables and columns must match the JPA entities. SchemaScriptValidationTest
-- runs this file on PostgreSQL 17 and starts the app against it.
--
-- Every table has Row Level Security plus a restrictive deny_all_api policy,
-- so Supabase's anon and authenticated API keys cannot read or write data.
-- The Spring Boot backend connects as the postgres role, which bypasses RLS.

begin;

create table if not exists campus_hubs (
    id                uuid primary key default gen_random_uuid(),
    name              text not null unique,
    latitude          double precision not null,
    longitude         double precision not null,
    radius_m          integer not null default 300,
    whitelisted_cidrs text[] not null default '{}'::text[],
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create table if not exists users (
    id            uuid primary key default gen_random_uuid(),
    email         text not null unique,
    full_name     text not null,
    password_hash text,
    role          text not null check (role in ('CANDIDATE', 'TECH_CHAMP', 'ADMIN')),
    default_mode  text not null default 'ON_SITE' check (default_mode in ('ON_SITE', 'WFH')),
    campus_id     uuid references campus_hubs (id),
    champion_id   uuid references users (id),
    active        boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table if not exists wfh_requests (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references users (id),
    start_date      date not null,
    end_date        date not null,
    reason          text not null,
    readiness       jsonb,
    status          text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by     uuid references users (id),
    reviewed_at     timestamptz,
    review_comment  text,
    ai_quality_flag boolean not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    check (end_date >= start_date)
);

create table if not exists attendance_records (
    id                    uuid primary key default gen_random_uuid(),
    user_id               uuid not null references users (id),
    attendance_date       date not null,
    work_mode             text not null check (work_mode in ('ON_SITE', 'WFH')),
    wfh_request_id        uuid references wfh_requests (id),
    clock_in_at           timestamptz,
    clock_out_at          timestamptz,
    arrival_status        text check (arrival_status in ('ON_TIME', 'LATE_UNEXCUSED', 'LATE_EXCUSED', 'ABSENT_UNEXCUSED')),
    departure_status      text check (departure_status in ('ON_TIME', 'PARTIAL_DAY', 'LATE_CLOCKOUT')),
    late_reason           text,
    early_clockout_reason text,
    late_clockout_note    text,
    deliverable_link      text,
    client_ip             text,
    ip_verified           boolean,
    geo_verified          boolean,
    latitude              double precision,
    longitude             double precision,
    distance_m            double precision,
    accuracy_m            double precision,
    ai_quality_flag       boolean not null default false,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    unique (user_id, attendance_date)
);

create table if not exists daily_prompts (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references users (id),
    attendance_id   uuid references attendance_records (id),
    prompt_date     date not null,
    stage           text not null check (stage in ('MORNING_KICKOFF', 'MIDDAY_PULSE', 'EOD_WRAP_UP')),
    scheduled_at    timestamptz not null,
    expires_at      timestamptz not null,
    status          text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'ACTIVE', 'SUBMITTED', 'EXPIRED')),
    response        jsonb,
    submitted_at    timestamptz,
    attempt_count   integer not null default 0,
    ai_quality_flag boolean not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (user_id, prompt_date, stage)
);

create table if not exists support_tickets (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references users (id),
    type            text not null check (type in ('IT_ISSUE', 'BLOCKER')),
    work_mode       text not null check (work_mode in ('ON_SITE', 'WFH')),
    title           text not null,
    description     text not null,
    attachment_url  text,
    status          text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED')),
    is_prolonged    boolean not null default false,
    resolved_by     uuid references users (id),
    resolved_at     timestamptz,
    resolution_note text,
    ai_quality_flag boolean not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table if not exists quality_attempts (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references users (id),
    context_type  text not null check (context_type in ('PROMPT', 'LATE_REASON', 'EARLY_CLOCKOUT', 'CLOCKOUT_NOTE', 'TICKET', 'WFH_REASON')),
    context_ref   text not null,
    attempts      integer not null default 0,
    last_feedback text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (user_id, context_type, context_ref)
);

create table if not exists audit_logs (
    id          uuid primary key default gen_random_uuid(),
    actor_id    uuid references users (id),
    action      text not null,
    target_type text,
    target_id   text,
    details     jsonb,
    created_at  timestamptz not null default now()
);

create table if not exists assessments (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    type            text not null check (type in ('WEEKLY', 'PROJECT')),
    mentor_id       uuid not null references users (id),
    assessment_date date not null,
    period_start    date not null,
    period_end      date not null,
    status          text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED')),
    group_feedback  text,
    submitted_at    timestamptz,
    reopened_by     uuid references users (id),
    reopened_at     timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    check (period_end >= period_start)
);

create table if not exists scorecard_entries (
    id                    uuid primary key default gen_random_uuid(),
    assessment_id         uuid not null references assessments (id) on delete cascade,
    candidate_id          uuid not null references users (id),
    attendance_score      smallint check (attendance_score between 1 and 5),
    communication_score   smallint check (communication_score between 1 and 5),
    accountability_score  smallint check (accountability_score between 1 and 5),
    creativity_score      smallint check (creativity_score between 1 and 5),
    delivery_score        smallint check (delivery_score between 1 and 5),
    tech_skills_score     smallint check (tech_skills_score between 1 and 5),
    overall_percent       smallint check (overall_percent between 0 and 100),
    feedback              text,
    feedback_strengths    text,
    feedback_improvements text,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    unique (assessment_id, candidate_id)
);

create table if not exists notifications (
    id            uuid primary key default gen_random_uuid(),
    recipient_id  uuid not null references users (id),
    created_by_id uuid references users (id),
    title         varchar(120) not null,
    message       text not null,
    type          varchar(32) not null,
    is_read       boolean not null default false,
    created_at    timestamptz not null default now()
);

create index if not exists idx_assessments_mentor on assessments (mentor_id, status);
create index if not exists idx_attendance_date on attendance_records (attendance_date);
create index if not exists idx_entries_candidate on scorecard_entries (candidate_id);
create index if not exists idx_prompts_status_expiry on daily_prompts (status, expires_at);
create index if not exists idx_tickets_open on support_tickets (status, created_at);
create index if not exists idx_wfh_user_status on wfh_requests (user_id, status);
create index if not exists idx_notifications_recipient on notifications (recipient_id, created_at);

-- RLS on, plus a restrictive deny-all policy for the public API roles.
do $$
declare
    t text;
begin
    foreach t in array array['campus_hubs', 'users', 'wfh_requests', 'attendance_records', 'daily_prompts',
                             'support_tickets', 'quality_attempts', 'audit_logs', 'assessments',
                             'scorecard_entries', 'notifications']
    loop
        execute format('alter table public.%I enable row level security', t);
        if not exists (select 1 from pg_policies
                       where schemaname = 'public' and tablename = t and policyname = 'deny_all_api') then
            execute format('create policy deny_all_api on public.%I as restrictive for all '
                           'to anon, authenticated using (false) with check (false)', t);
        end if;
    end loop;
end
$$;

commit;
