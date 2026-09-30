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

## Email alerts for pending posts

The `supabase/functions/notify-pending-post` Edge Function emails the host when a new guestbook post is submitted. It ignores non-pending records, checks a shared webhook secret, and sends through Resend. Configure the function and database webhook in the Supabase Dashboard:

1. Create a Resend account and API key, and choose a sender permitted by that account. Resend's shared `onboarding@resend.dev` sender is test-only and may be limited to the account's own verified recipient; otherwise, verify a domain you control and use a sender on that domain.
2. In Supabase → Edge Functions, create `notify-pending-post` from `supabase/functions/notify-pending-post/index.ts` and turn off JWT verification for the function. The handler validates its own random webhook secret.
3. In Supabase → Edge Function Secrets, set `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFICATION_EMAIL`, and `PENDING_POST_WEBHOOK_SECRET`. Set `NOTIFICATION_EMAIL` to the host's email address and generate a long random value for the webhook secret.
4. In Supabase → Database Webhooks, add an `INSERT` webhook for `public.guestbook_messages` pointing to the `notify-pending-post` function. Add the HTTP header `x-pending-post-secret` with the same value as `PENDING_POST_WEBHOOK_SECRET`.

The notification email includes the author's name, a short message preview, and a link to the table editor. Keep all email and webhook secrets in Supabase Function Secrets and the Dashboard webhook configuration; do not commit them to GitHub or put them in `site/config.js`.

## Publish with GitHub Pages

1. Push this repository to GitHub, on a branch named `main`.
2. In the repository, open Settings → Pages and choose **GitHub Actions** as the build and deployment source.
3. The included workflow deploys the `site/` folder on each push to `main`. After the first successful run, GitHub Pages shows the public URL in Settings → Pages.
4. Share that URL with classmates. Anyone with the URL can read public notes and submit notes for approval; it can be forwarded.

The page keeps working as a preview before Supabase is configured, but guestbook posting is disabled until `site/config.js` has valid project values.
