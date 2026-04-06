import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "AI Water Cooler <digest@isagihere.wiki>";
const SITE_URL = "https://isagihere.wiki";
const AMBER = "#F59E0B";
const BG = "#0a0a0f";
const CARD = "#111118";
const BORDER = "#2a2a3a";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";

// ─── SHARED LAYOUT ─────────────────────────────────────────────────────────

function wrapHtml(body: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>AI Water Cooler</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Courier New',Courier,monospace;color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="border-bottom:1px solid ${BORDER};padding-bottom:20px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-family:'Courier New',monospace;font-size:16px;font-weight:bold;color:${AMBER};letter-spacing:2px;">AI_WATER_COOLER</span>
            </td>
            <td align="right">
              <span style="font-size:10px;color:${MUTED};letter-spacing:1px;">isagihere.wiki</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding-top:28px;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="border-top:1px solid ${BORDER};padding-top:20px;margin-top:32px;text-align:center;">
        <p style="font-size:10px;color:${MUTED};margin:4px 0;letter-spacing:1px;">DATA_STREAM: ACTIVE</p>
        <p style="font-size:10px;color:${MUTED};margin:4px 0;">
          <a href="${SITE_URL}" style="color:${AMBER};text-decoration:none;">isagihere.wiki</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}/unsubscribe" style="color:${MUTED};text-decoration:none;">unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── REPLY NOTIFICATION ────────────────────────────────────────────────────

export async function sendReplyNotification({
  toEmail,
  toName,
  replierName,
  replyContent,
  originalContent,
  entityType,
  entityId,
  entityName,
}: {
  toEmail: string;
  toName: string;
  replierName: string;
  replyContent: string;
  originalContent: string;
  entityType: string;
  entityId: number;
  entityName: string;
}) {
  const entityUrl = `${SITE_URL}/${entityType === "person" ? "people" : "feed"}/${entityId}`;

  const body = `
    <p style="font-size:11px;color:${AMBER};letter-spacing:2px;margin:0 0 16px;">NEW_REPLY_DETECTED</p>
    <h2 style="font-size:20px;font-weight:bold;margin:0 0 8px;color:${TEXT};">Someone replied to your comment</h2>
    <p style="font-size:13px;color:${MUTED};margin:0 0 24px;">On: <strong style="color:${TEXT};">${entityName}</strong></p>

    <!-- Original comment -->
    <div style="background:${CARD};border:1px solid ${BORDER};border-left:3px solid ${MUTED};padding:14px 16px;margin-bottom:4px;">
      <p style="font-size:10px;color:${MUTED};margin:0 0 6px;letter-spacing:1px;">YOUR_COMMENT</p>
      <p style="font-size:13px;color:${MUTED};margin:0;line-height:1.6;">${escapeHtml(originalContent)}</p>
    </div>

    <!-- Reply -->
    <div style="background:${CARD};border:1px solid ${AMBER}40;border-left:3px solid ${AMBER};padding:14px 16px;margin-bottom:24px;">
      <p style="font-size:10px;color:${AMBER};margin:0 0 6px;letter-spacing:1px;">${escapeHtml(replierName).toUpperCase()}_REPLIED</p>
      <p style="font-size:14px;color:${TEXT};margin:0;line-height:1.6;">${escapeHtml(replyContent)}</p>
    </div>

    <a href="${entityUrl}" style="display:inline-block;background:${AMBER};color:#000;font-family:'Courier New',monospace;font-size:12px;font-weight:bold;padding:10px 20px;text-decoration:none;letter-spacing:1px;">VIEW_DISCUSSION →</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${replierName} replied to your comment on AI Water Cooler`,
    html: wrapHtml(body, `${replierName} replied to your comment on ${entityName}`),
  });
}

// ─── WEEKLY DIGEST ────────────────────────────────────────────────────────

export type DigestItem = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: Date | null;
};

export type DigestPerson = {
  name: string;
  id: number;
  role: string;
  imageUrl?: string | null;
};

export async function sendWeeklyDigest({
  toEmail,
  toName,
  topStories,
  spotlightPeople,
  weekLabel,
  stats,
}: {
  toEmail: string;
  toName?: string;
  topStories: DigestItem[];
  spotlightPeople: DigestPerson[];
  weekLabel: string;
  stats: { totalStories: number; sourcesActive: number; peopleTracked: number };
}) {
  const greeting = toName ? `Hello ${toName},` : "Hello,";

  const storiesHtml = topStories.slice(0, 8).map((s, i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="28" valign="top">
              <span style="font-family:'Courier New',monospace;font-size:10px;color:${MUTED};">${String(i + 1).padStart(2, "0")}</span>
            </td>
            <td>
              <a href="${s.url}" style="font-size:14px;color:${TEXT};text-decoration:none;line-height:1.4;display:block;margin-bottom:4px;">${escapeHtml(s.title)}</a>
              <span style="font-size:10px;color:${MUTED};letter-spacing:1px;">${escapeHtml(s.sourceName || "")}${s.publishedAt ? " · " + formatDate(s.publishedAt) : ""}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const peopleHtml = spotlightPeople.slice(0, 4).map(p => `
    <td width="25%" valign="top" style="padding:0 6px;text-align:center;">
      <a href="${SITE_URL}/people/${p.id}" style="text-decoration:none;">
        <div style="width:56px;height:56px;background:${CARD};border:1px solid ${BORDER};border-radius:2px;margin:0 auto 8px;overflow:hidden;">
          ${p.imageUrl ? `<img src="${p.imageUrl}" width="56" height="56" alt="${escapeHtml(p.name)}" style="object-fit:cover;display:block;filter:grayscale(100%);" />` : `<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:${AMBER};">${p.name.charAt(0)}</div>`}
        </div>
        <p style="font-size:11px;font-weight:bold;color:${TEXT};margin:0 0 2px;">${escapeHtml(p.name)}</p>
        <p style="font-size:9px;color:${MUTED};margin:0;">${escapeHtml(p.role).substring(0, 30)}</p>
      </a>
    </td>
  `).join("");

  const body = `
    <!-- Week label -->
    <p style="font-size:11px;color:${AMBER};letter-spacing:2px;margin:0 0 6px;">WEEKLY_SIGNAL · ${weekLabel}</p>
    <h1 style="font-size:24px;font-weight:bold;margin:0 0 8px;color:${TEXT};">The AI Water Cooler Digest</h1>
    <p style="font-size:13px;color:${MUTED};margin:0 0 28px;line-height:1.6;">${greeting} Here's the signal from the past week — the stories worth reading, the people worth watching.</p>

    <!-- Stats bar -->
    <div style="background:${CARD};border:1px solid ${BORDER};padding:12px 16px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;border-right:1px solid ${BORDER};">
            <p style="font-size:18px;font-weight:bold;color:${AMBER};margin:0;">${stats.totalStories}</p>
            <p style="font-size:9px;color:${MUTED};margin:2px 0 0;letter-spacing:1px;">STORIES_THIS_WEEK</p>
          </td>
          <td style="text-align:center;border-right:1px solid ${BORDER};">
            <p style="font-size:18px;font-weight:bold;color:${AMBER};margin:0;">${stats.sourcesActive}</p>
            <p style="font-size:9px;color:${MUTED};margin:2px 0 0;letter-spacing:1px;">SOURCES_ACTIVE</p>
          </td>
          <td style="text-align:center;">
            <p style="font-size:18px;font-weight:bold;color:${AMBER};margin:0;">${stats.peopleTracked}</p>
            <p style="font-size:9px;color:${MUTED};margin:2px 0 0;letter-spacing:1px;">PEOPLE_TRACKED</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Top stories -->
    <p style="font-size:11px;color:${AMBER};letter-spacing:2px;margin:0 0 12px;">TOP_STORIES</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${storiesHtml}
    </table>

    ${spotlightPeople.length > 0 ? `
    <!-- People spotlight -->
    <p style="font-size:11px;color:${AMBER};letter-spacing:2px;margin:0 0 12px;">PEOPLE_IN_FOCUS</p>
    <div style="background:${CARD};border:1px solid ${BORDER};padding:16px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${peopleHtml}</tr>
      </table>
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="text-align:center;padding:20px 0;">
      <a href="${SITE_URL}" style="display:inline-block;background:${AMBER};color:#000;font-family:'Courier New',monospace;font-size:12px;font-weight:bold;padding:12px 28px;text-decoration:none;letter-spacing:1px;">OPEN_THE_HUB →</a>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `The AI Water Cooler Digest — ${weekLabel}`,
    html: wrapHtml(body, `Top AI stories this week: ${topStories[0]?.title || "Your weekly signal briefing"}`),
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
