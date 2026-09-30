type PendingPost = {
  id?: number | string;
  name?: string;
  body?: string;
  status?: string;
};

type DatabaseWebhook = {
  type?: string;
  schema?: string;
  table?: string;
  record?: PendingPost;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("PENDING_POST_WEBHOOK_SECRET");
  const suppliedSecret = request.headers.get("x-pending-post-secret");
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("RESEND_FROM");
  const recipient = Deno.env.get("NOTIFICATION_EMAIL");
  if (!resendApiKey || !sender || !recipient) {
    console.error("Email notification secrets are not configured.");
    return json({ error: "Email notifications are not configured" }, 503);
  }

  let payload: DatabaseWebhook;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  if (payload.schema !== "public" || payload.table !== "guestbook_messages") {
    return json({ ignored: "Not a guestbook message" });
  }
  if (payload.type !== "INSERT" || payload.record?.status !== "pending") {
    return json({ ignored: "Not a new pending post" });
  }

  const { id, name, body } = payload.record;
  if (id === undefined || !name || !body) {
    return json({ error: "Guestbook message is missing required fields" }, 400);
  }

  // Keep the headline ASCII-only so email clients with incorrect MIME charset
  // handling cannot turn the apostrophe into mojibake.
  const subject = "A new Forman '77 post is waiting for approval";
  const approvalUrl = "https://supabase.com/dashboard/project/hewnomfymflkdutvqiap/editor/17598?schema=public";
  const safeName = escapeHtml(name);
  const preview = body.trim().slice(0, 240);
  const safePreview = escapeHtml(preview);
  const text = `A new post from ${name} is waiting for your approval.\n\n${preview}${body.length > preview.length ? "…" : ""}\n\nReview pending posts: ${approvalUrl}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><h2>A new Forman '77 post is waiting for approval</h2><p><strong>${safeName}</strong> shared:</p><p>${safePreview}${body.length > preview.length ? "…" : ""}</p><p><a href="${approvalUrl}">Review pending posts</a></p></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `pending-guestbook-post-${id}`,
    },
    body: JSON.stringify({ from: sender, to: [recipient], subject, text, html }),
  });

  if (!response.ok) {
    console.error("Resend rejected the notification:", response.status, await response.text());
    return json({ error: "Email provider rejected the notification" }, 502);
  }

  return json({ sent: true, postId: id });
});
