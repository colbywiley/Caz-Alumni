import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth";
import { inviteSchema } from "@/lib/validators/invite";
import { renderInviteEmail } from "@/lib/email/inviteTemplate";

export const runtime = "nodejs";

type SendResult = { email: string; ok: boolean; error?: string };

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to send invites." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { emails, note } = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.INVITE_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    console.error("Invite email not configured: missing RESEND_API_KEY or INVITE_FROM_EMAIL");
    return NextResponse.json(
      { error: "Email sending isn't configured yet. Please ask an admin to set RESEND_API_KEY and INVITE_FROM_EMAIL." },
      { status: 503 },
    );
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const inviterName = profile.display_name || profile.full_name || "A Caz alum";
  const replyTo = profile.email ?? undefined;
  const resend = new Resend(apiKey);

  const results: SendResult[] = await Promise.all(
    emails.map(async (email): Promise<SendResult> => {
      const joinUrl = `${siteUrl}/login?invite=1&email=${encodeURIComponent(email)}`;
      const { subject, html, text } = renderInviteEmail({
        inviterName,
        inviterEmail: profile.email ?? null,
        note,
        joinUrl,
        siteUrl,
      });

      try {
        const { error } = await resend.emails.send({
          from: fromAddress,
          to: email,
          subject,
          html,
          text,
          replyTo,
        });
        if (error) {
          console.error(`Resend send error for ${email}:`, error);
          return { email, ok: false, error: error.message ?? "Send failed" };
        }
        return { email, ok: true };
      } catch (err) {
        console.error(`Resend threw for ${email}:`, err);
        return { email, ok: false, error: "Send failed" };
      }
    }),
  );

  const sent = results.filter((r) => r.ok).map((r) => r.email);
  const failed = results.filter((r) => !r.ok);

  if (sent.length === 0) {
    return NextResponse.json(
      { error: "We couldn't send any of those invitations. Please try again in a moment.", failed },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent, failed });
}
