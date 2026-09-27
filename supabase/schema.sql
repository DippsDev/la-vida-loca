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
    if exists (select 1 from public.minor_flags where email = new.email) then
      raise exception 'minor_flag' using errcode = 'P0001';
    end if;
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

-- Emails entered with an age under 18. Hosts clear a row to let that guest RSVP again.
create table public.minor_flags (
  email text primary key,
  first_name text,
  surname text,
  age smallint not null,
  created_at timestamptz not null default now(),
  constraint minor_flags_email_format check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint minor_flags_age_range check (age between 1 and 17),
  constraint minor_flags_first_name_len check (first_name is null or char_length(btrim(first_name)) between 1 and 80),
  constraint minor_flags_surname_len check (surname is null or char_length(btrim(surname)) between 1 and 80)
);

create or replace function public.minor_flags_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  new.first_name := nullif(btrim(coalesce(new.first_name, '')), '');
  new.surname := nullif(btrim(coalesce(new.surname, '')), '');
  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.now();
  else
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

revoke all on function public.minor_flags_guard() from public, anon, authenticated;

create trigger minor_flags_guard
before insert or update on public.minor_flags
for each row
execute function public.minor_flags_guard();

alter table public.minor_flags enable row level security;

create policy minor_flags_insert
  on public.minor_flags
  for insert
  to anon, authenticated
  with check (true);

create policy minor_flags_select
  on public.minor_flags
  for select
  to anon, authenticated
  using (true);

create policy minor_flags_update
  on public.minor_flags
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy minor_flags_delete
  on public.minor_flags
  for delete
  to anon, authenticated
  using (true);

revoke all on table public.minor_flags from anon, authenticated;
grant select, insert, update, delete on public.minor_flags to anon, authenticated;
grant select, insert, update, delete on public.minor_flags to service_role;

-- Realtime for the admin inbox
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.minor_flags;

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

-- One receipt email per request, and one email each time the host's decision changes.
create extension if not exists pg_net;

create table public.request_mail (
  request_id bigint primary key references public.requests (id) on delete cascade,
  receipt_sent_at timestamptz,
  decision_status text,
  decision_sent_at timestamptz,
  constraint request_mail_decision_status check (
    decision_status is null or decision_status in ('APPROVED', 'REJECTED')
  ),
  constraint request_mail_decision_pair check (
    (decision_status is null and decision_sent_at is null)
    or (decision_status is not null and decision_sent_at is not null)
  )
);

alter table public.request_mail enable row level security;

create policy request_mail_no_client_access
  on public.request_mail
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.request_mail from public, anon, authenticated;
grant select, insert, update, delete on public.request_mail to service_role;

create or replace function public.claim_rsvp_receipt(target_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id bigint;
begin
  insert into public.request_mail (request_id, receipt_sent_at)
  values (target_id, pg_catalog.now())
  on conflict (request_id) do update
    set receipt_sent_at = pg_catalog.now()
    where public.request_mail.receipt_sent_at is null
  returning request_id into claimed_id;

  return claimed_id is not null;
end;
$$;

create or replace function public.release_rsvp_receipt(target_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.request_mail
  set receipt_sent_at = null
  where request_id = target_id;
$$;

create or replace function public.claim_rsvp_decision(target_id bigint, next_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id bigint;
begin
  if next_status is null or next_status not in ('APPROVED', 'REJECTED') then
    return false;
  end if;

  insert into public.request_mail (request_id, decision_status, decision_sent_at)
  values (target_id, next_status, pg_catalog.now())
  on conflict (request_id) do update
    set
      decision_status = excluded.decision_status,
      decision_sent_at = pg_catalog.now()
    where public.request_mail.decision_status is distinct from excluded.decision_status
  returning request_id into claimed_id;

  return claimed_id is not null;
end;
$$;

create or replace function public.release_rsvp_decision(target_id bigint, next_status text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.request_mail
  set decision_status = null,
      decision_sent_at = null
  where request_id = target_id
    and decision_status = next_status;
$$;

revoke all on function public.claim_rsvp_receipt(bigint) from public, anon, authenticated;
revoke all on function public.release_rsvp_receipt(bigint) from public, anon, authenticated;
revoke all on function public.claim_rsvp_decision(bigint, text) from public, anon, authenticated;
revoke all on function public.release_rsvp_decision(bigint, text) from public, anon, authenticated;

grant execute on function public.claim_rsvp_receipt(bigint) to service_role;
grant execute on function public.release_rsvp_receipt(bigint) to service_role;
grant execute on function public.claim_rsvp_decision(bigint, text) to service_role;
grant execute on function public.release_rsvp_decision(bigint, text) to service_role;

-- Queues mail after commit. Requires the rsvp-mail Edge Function secrets
-- RESEND_API_KEY, RSVP_FROM_EMAIL (for example La Vida Loca <rsvp@yourdomain.com>),
-- and SITE_URL (the public site, with no trailing slash).
-- Decision emails link to SITE_URL/status?email=…
create or replace function public.requests_queue_mail()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text;
  request_id bigint;
begin
  if tg_op = 'INSERT' then
    kind := 'receipt';
    request_id := new.id;
  elsif tg_op = 'UPDATE'
    and new.status is distinct from old.status
    and new.status in ('APPROVED', 'REJECTED')
  then
    kind := 'decision';
    request_id := new.id;
  else
    return new;
  end if;

  begin
    perform net.http_post(
      url := 'https://pynxtrdndibgcxbnaeul.supabase.co/functions/v1/rsvp-mail',
      body := pg_catalog.jsonb_build_object(
        'kind', kind,
        'record', pg_catalog.jsonb_build_object('id', request_id)
      ),
      params := '{}'::jsonb,
      headers := pg_catalog.jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bnh0cmRuZGliZ2N4Ym5hZXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjM3NTgsImV4cCI6MjEwNTczOTc1OH0.4-kFI2n1DC0hN_fzfigT4vr_Dtx3NKbEfUB450Eooa0'
      ),
      timeout_milliseconds := 5000
    );
  exception
    when others then
      raise warning 'rsvp mail queue failed: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.requests_queue_mail() from public, anon, authenticated;

create trigger requests_queue_mail
after insert or update on public.requests
for each row
execute function public.requests_queue_mail();

-- Notes left from the About page: feedback for the hosts, or a bug report.
create table public.house_notes (
  id bigint generated always as identity primary key,
  kind text not null,
  body text not null,
  email text,
  created_at timestamptz not null default now(),
  constraint house_notes_kind check (kind in ('feedback', 'bug')),
  constraint house_notes_body_len check (char_length(btrim(body)) between 1 and 1000),
  constraint house_notes_email_format check (
    email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create index house_notes_created_at_idx on public.house_notes (created_at desc);

create or replace function public.house_notes_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.kind := lower(btrim(new.kind));
  new.body := btrim(new.body);
  new.email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.now();
  else
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

revoke all on function public.house_notes_guard() from public, anon, authenticated;

create trigger house_notes_guard
before insert or update on public.house_notes
for each row
execute function public.house_notes_guard();

alter table public.house_notes enable row level security;

create policy house_notes_insert
  on public.house_notes
  for insert
  to anon, authenticated
  with check (kind in ('feedback', 'bug'));

create policy house_notes_select
  on public.house_notes
  for select
  to anon, authenticated
  using (true);

revoke all on table public.house_notes from anon, authenticated;
grant select, insert on public.house_notes to anon, authenticated;
grant select, insert, update, delete on public.house_notes to service_role;
grant usage, select on sequence public.house_notes_id_seq to anon, authenticated, service_role;
