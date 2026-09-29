-- Run this once in the Supabase SQL Editor for your project.
create table if not exists public.guestbook_messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'published')),
  created_at timestamptz not null default now()
);

alter table public.guestbook_messages enable row level security;

-- Anyone can read only messages you have approved.
create policy "Anyone can read published messages"
on public.guestbook_messages for select
to anon, authenticated
using (status = 'published');

-- Visitors can submit; every submission starts pending and is reviewed in Supabase.
create policy "Visitors can submit pending messages"
on public.guestbook_messages for insert
to anon, authenticated
with check (status = 'pending');

grant select on public.guestbook_messages to anon, authenticated;
grant insert (name, body) on public.guestbook_messages to anon, authenticated;

-- Enable live updates for classmates who already have the page open.
alter publication supabase_realtime add table public.guestbook_messages;
