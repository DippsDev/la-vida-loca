-- La Vida LOCA — guest RSVPs
-- Applied to the hosted project as migration create_rsvp_requests.

create table public.requests (
  id bigint generated always as identity primary key,
  first_name text not null,
  surname text not null,
  email text not null,
  phone text not null,
  age smallint not null,
  note text,
  ticket_code text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint requests_first_name_len check (char_length(btrim(first_name)) between 1 and 80),
  constraint requests_surname_len check (char_length(btrim(surname)) between 1 and 80),
  constraint requests_email_format check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint requests_phone_digits check (char_length(regexp_replace(phone, '\D', '', 'g')) between 7 and 15),
  constraint requests_age_range check (age between 1 and 120),
  constraint requests_note_len check (note is null or char_length(note) <= 1000),
  constraint requests_ticket_code_format check (ticket_code ~ '^LV-[A-F0-9]{6}$'),
  constraint requests_status_values check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  constraint requests_decision_consistency check (
    (status = 'PENDING' and decided_at is null)
    or (status in ('APPROVED', 'REJECTED') and decided_at is not null)
  )
);

create unique index requests_ticket_code_idx on public.requests (ticket_code);
create unique index requests_email_lower_idx on public.requests (lower(email));
create unique index requests_phone_digits_idx on public.requests (regexp_replace(phone, '\D', '', 'g'));
create index requests_created_at_idx on public.requests (created_at desc);
create index requests_status_created_at_idx on public.requests (status, created_at desc);

create or replace function public.requests_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.first_name := btrim(new.first_name);
    new.surname := btrim(new.surname);
    new.email := lower(btrim(new.email));
    new.phone := btrim(new.phone);
    new.note := nullif(btrim(coalesce(new.note, '')), '');
    new.ticket_code := 'LV-' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 6));
    new.status := 'PENDING';
    new.decided_at := null;
    new.created_at := now();
    return new;
  end if;

  new.id := old.id;
  new.first_name := old.first_name;
  new.surname := old.surname;
  new.email := old.email;
  new.phone := old.phone;
  new.age := old.age;
  new.note := old.note;
  new.ticket_code := old.ticket_code;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    if new.status = 'PENDING' then
      new.decided_at := null;
    elsif new.status in ('APPROVED', 'REJECTED') then
      new.decided_at := now();
    else
      raise exception 'invalid status';
    end if;
  else
    new.decided_at := old.decided_at;
  end if;

  return new;
end;
$$;

revoke all on function public.requests_guard() from public, anon, authenticated;

create trigger requests_guard
before insert or update on public.requests
for each row
execute function public.requests_guard();

alter table public.requests enable row level security;

create policy requests_insert_pending
  on public.requests
  for insert
  to anon, authenticated
  with check (status = 'PENDING');

create policy requests_select_inbox
  on public.requests
  for select
  to anon, authenticated
  using (true);

create policy requests_update_decision
  on public.requests
  for update
  to anon, authenticated
  using (true)
  with check (status in ('PENDING', 'APPROVED', 'REJECTED'));

revoke all on table public.requests from anon, authenticated;
grant select, insert, update on public.requests to anon, authenticated;
grant select, insert, update, delete on public.requests to service_role;
grant usage, select on sequence public.requests_id_seq to anon, authenticated, service_role;

-- Realtime for the admin inbox
alter publication supabase_realtime add table public.requests;

-- Drop pending requests once they are older than 20 days.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.clear_stale_pending_requests()
returns integer
language sql
security invoker
set search_path = ''
as $$
  with removed as (
    delete from public.requests
    where status = 'PENDING'
      and created_at < pg_catalog.now() - interval '20 days'
    returning 1
  )
  select count(*)::integer from removed;
$$;

revoke all on function public.clear_stale_pending_requests() from public, anon, authenticated;

select cron.schedule(
  'clear-stale-pending-requests',
  '15 * * * *',
  $$select public.clear_stale_pending_requests()$$
);
