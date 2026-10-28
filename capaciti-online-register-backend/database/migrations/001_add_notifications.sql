-- Adds the notifications table that the backend expects (missing in Supabase on 2026-10-28).
-- Run once in the Supabase SQL Editor. Safe to run again.

begin;

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

create index if not exists idx_notifications_recipient on notifications (recipient_id, created_at);

alter table notifications enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies
                   where schemaname = 'public' and tablename = 'notifications' and policyname = 'deny_all_api') then
        create policy deny_all_api on public.notifications as restrictive for all
            to anon, authenticated using (false) with check (false);
    end if;
end
$$;

commit;
