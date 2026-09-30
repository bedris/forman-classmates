-- Run once after photo-attachments.sql to support multiple photos per post.

alter table public.guestbook_messages
  add column if not exists photo_paths text[] not null default '{}';

grant insert (name, body, photo_paths) on public.guestbook_messages to anon, authenticated;

create policy "Approved guestbook photo galleries can be viewed"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'guestbook-photos'
  and exists (
    select 1
    from public.guestbook_messages as message
    where storage.objects.name = any(coalesce(message.photo_paths, array[]::text[]))
      and message.status = 'published'
  )
);
