# Forman Classmates

A static reunion site for GitHub Pages with a Supabase powered shared guestbook. Visitors do not need accounts. New notes are held for approval before they appear publicly.

## Connect Supabase

1. Create a Supabase project.
2. In its SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Open the project's API settings and copy the Project URL and publishable/anon key.
4. Put those two public values in [`site/config.js`](site/config.js). Do not use a `service_role` key here.
5. To approve a note, open Table Editor → `guestbook_messages` and change its `status` from `pending` to `published`. To remove a note, delete its row.

## Add photo attachments

For an existing project, run [`supabase/photo-galleries.sql`](supabase/photo-galleries.sql) after the earlier [`supabase/photo-attachments.sql`](supabase/photo-attachments.sql) setup. The private `guestbook-photos` bucket accepts up to four JPG, PNG, or WebP files per message, each up to 5 MB. Photo reads are allowed only when the linked message is published. Photos are served with seven-day signed URLs, so a page left open longer than that may need a refresh to reload images.

The database rules allow anyone to read approved notes and submit new pending notes. They do not allow visitors to publish, edit, or delete notes. The Supabase publishable/anon key is intended for the browser; the row-level security policies in `supabase/schema.sql` protect the table.

## Publish with GitHub Pages

1. Push this repository to GitHub, on a branch named `main`.
2. In the repository, open Settings → Pages and choose **GitHub Actions** as the build and deployment source.
3. The included workflow deploys the `site/` folder on each push to `main`. After the first successful run, GitHub Pages shows the public URL in Settings → Pages.
4. Share that URL with classmates. Anyone with the URL can read public notes and submit notes for approval; it can be forwarded.

The page keeps working as a preview before Supabase is configured, but guestbook posting is disabled until `site/config.js` has valid project values.
