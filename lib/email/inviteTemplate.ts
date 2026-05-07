type InviteTemplateInput = {
  inviterName: string;
  inviterEmail?: string | null;
  note?: string;
  joinUrl: string;
  siteUrl: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInviteEmail({
  inviterName,
  inviterEmail,
  note,
  joinUrl,
  siteUrl,
}: InviteTemplateInput): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(inviterName);
  const safeNote = note ? escapeHtml(note) : "";
  const safeJoin = escapeHtml(joinUrl);
  const safeSite = escapeHtml(siteUrl);

  const subject = `${inviterName} invited you to join the Caz Alumni Connect directory`;

  const noteBlock = safeNote
    ? `
        <tr>
          <td style="padding: 0 32px 8px 32px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #5a5a5a; text-transform: uppercase; letter-spacing: 0.04em; font-family: 'Roboto Slab', Georgia, serif;">A note from ${safeName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 24px 32px;">
            <div style="border-left: 3px solid #b99b63; background: #f7f5e7; padding: 14px 18px; border-radius: 6px; color: #2a2622; font-size: 15px; line-height: 1.55; white-space: pre-wrap;">${safeNote}</div>
          </td>
        </tr>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f2f4e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2a2622;">
    <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
      ${safeName} thinks you'd love to reconnect with fellow Caz alumni.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f4e8; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e3e0d0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td style="background: linear-gradient(135deg, #548636 0%, #3e6727 60%, #2f4f1d 100%); padding: 40px 32px; text-align: center;">
                <p style="margin: 0; color: #f7f5e7; font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;">Cazadero Performing Arts Camp</p>
                <h1 style="margin: 12px 0 0 0; color: #ffffff; font-family: 'Roboto Slab', Georgia, serif; font-size: 30px; line-height: 1.15; font-weight: 700;">You're invited to Caz Alumni Connect</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 8px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
                  <strong>${safeName}</strong> thought you'd want to reconnect with fellow Caz alumni on
                  <strong>Caz Alumni Connect</strong> &mdash; a private directory for campers, staff, and board members past and present to find each other, share what they're up to, and stay in touch.
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                  Joining takes about a minute. You decide what's visible and you can opt out at any time.
                </p>
              </td>
            </tr>
            ${noteBlock}
            <tr>
              <td align="center" style="padding: 8px 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color: #548636; border-radius: 8px;">
                      <a href="${safeJoin}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Accept your invitation</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px 32px 32px;">
                <p style="margin: 0; font-size: 13px; color: #5a5a5a; line-height: 1.6; text-align: center;">
                  Or paste this link into your browser:<br />
                  <a href="${safeJoin}" style="color: #3e6727; word-break: break-all;">${safeJoin}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f7f5e7; border-top: 1px solid #e3e0d0; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #5a5a5a; line-height: 1.6;">
                  You're receiving this because ${safeName}${
                    inviterEmail ? ` (${escapeHtml(inviterEmail)})` : ""
                  } sent you an invitation from <a href="${safeSite}" style="color: #3e6727;">Caz Alumni Connect</a>.<br />
                  If you weren't expecting this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${inviterName} invited you to join Caz Alumni Connect`,
    "",
    `${inviterName} thought you'd want to reconnect with fellow Cazadero Performing Arts Camp alumni on Caz Alumni Connect — a private directory for campers, staff, and board.`,
    note ? `\nA note from ${inviterName}:\n"${note}"\n` : "",
    `Accept your invitation: ${joinUrl}`,
    "",
    `If you weren't expecting this, you can safely ignore this email.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
