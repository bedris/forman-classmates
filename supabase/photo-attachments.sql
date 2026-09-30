-- Run once in the Supabase SQL Editor to add moderated photo attachments.
-- Photos remain in a private bucket until their guestbook message is approved.

alter table public.guestbook_messages
  add column if not exists photo_path text;

grant insert (name, body, photo_path) on public.guestbook_messages to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guestbook-photos',
  'guestbook-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Classmates can upload guestbook photos"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'guestbook-photos'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

create policy "Approved guestbook photos can be viewed"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'guestbook-photos'
  and exists (
    select 1
    from public.guestbook_messages as message
    where message.photo_path = storage.objects.name
      and message.status = 'published'
  )
);
