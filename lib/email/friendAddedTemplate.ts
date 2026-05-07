type FriendAddedTemplateInput = {
  recipientName: string;
  frienderName: string;
  frienderEmail?: string | null;
  profileUrl: string;
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

export function renderFriendAddedEmail({
  recipientName,
  frienderName,
  frienderEmail,
  profileUrl,
  siteUrl,
}: FriendAddedTemplateInput): { subject: string; html: string; text: string } {
  const safeRecipient = escapeHtml(recipientName);
  const safeFriender = escapeHtml(frienderName);
  const safeProfile = escapeHtml(profileUrl);
  const safeSite = escapeHtml(siteUrl);

  const subject = `${frienderName} added you as a friend on Caz Alumni Connect`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f2f4e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2a2622;">
    <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
      ${safeFriender} added you as a friend on Caz Alumni Connect.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f4e8; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e3e0d0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td style="background: linear-gradient(135deg, #548636 0%, #3e6727 60%, #2f4f1d 100%); padding: 40px 32px; text-align: center;">
                <p style="margin: 0; color: #f7f5e7; font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;">Caz Alumni Connect</p>
                <h1 style="margin: 12px 0 0 0; color: #ffffff; font-family: 'Roboto Slab', Georgia, serif; font-size: 28px; line-height: 1.2; font-weight: 700;">You&rsquo;ve got a new friend</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 8px 32px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Hi ${safeRecipient},</p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
                  <strong>${safeFriender}</strong> just added you as a friend on <strong>Caz Alumni Connect</strong>. Take a look at their profile and reconnect.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 8px 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color: #548636; border-radius: 8px;">
                      <a href="${safeProfile}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">View ${safeFriender}&rsquo;s profile</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px 32px 32px;">
                <p style="margin: 0; font-size: 13px; color: #5a5a5a; line-height: 1.6; text-align: center;">
                  Or paste this link into your browser:<br />
                  <a href="${safeProfile}" style="color: #3e6727; word-break: break-all;">${safeProfile}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f7f5e7; border-top: 1px solid #e3e0d0; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #5a5a5a; line-height: 1.6;">
                  You&rsquo;re receiving this because you have friend-add notifications turned on at
                  <a href="${safeSite}" style="color: #3e6727;">Caz Alumni Connect</a>.<br />
                  You can turn these off any time on your <a href="${safeSite}/profile" style="color: #3e6727;">profile page</a>.
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
    `${frienderName} added you as a friend on Caz Alumni Connect`,
    "",
    `Hi ${recipientName},`,
    "",
    `${frienderName}${frienderEmail ? ` (${frienderEmail})` : ""} just added you as a friend on Caz Alumni Connect.`,
    "",
    `View their profile: ${profileUrl}`,
    "",
    `You can turn these emails off any time on your profile page: ${siteUrl}/profile`,
  ].join("\n");

  return { subject, html, text };
}
