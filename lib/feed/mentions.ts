// Mentions are stored inline in the post / comment content as
//   @[Display Name](uuid)
// where the uuid is the mentioned profile's id. Display Name is restricted to
// printable characters with closing ] / ) escaped.
//
// This format keeps mentions self-describing in the database (no join tables to
// keep in sync) while still letting the server reliably extract the set of
// mentioned profile ids when fanning out notifications.

const UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const MENTION_RE = new RegExp(
  String.raw`@\[([^\]]{1,80})\]\((${UUID_RE})\)`,
  "gi",
);

export type ParsedMentionToken =
  | { kind: "text"; text: string }
  | { kind: "mention"; profileId: string; name: string };

export function parseMentionTokens(content: string): ParsedMentionToken[] {
  const out: ParsedMentionToken[] = [];
  let lastIndex = 0;
  // Reset the regex's stateful lastIndex.
  const re = new RegExp(MENTION_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      out.push({ kind: "text", text: content.slice(lastIndex, m.index) });
    }
    out.push({ kind: "mention", profileId: m[2].toLowerCase(), name: m[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < content.length) {
    out.push({ kind: "text", text: content.slice(lastIndex) });
  }
  return out;
}

export function extractMentionedProfileIds(content: string): string[] {
  const ids = new Set<string>();
  for (const tok of parseMentionTokens(content)) {
    if (tok.kind === "mention") ids.add(tok.profileId);
  }
  return Array.from(ids);
}

// When constructing a mention from the composer's autocomplete, we strip any
// characters that would break our marker syntax.
export function sanitizeMentionName(name: string): string {
  return name
    .replace(/[\]\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function buildMentionMarker(profileId: string, name: string): string {
  return `@[${sanitizeMentionName(name) || "alum"}](${profileId})`;
}

// Strip mention markup down to plain text — used for email previews.
export function mentionsToPlainText(content: string): string {
  return content.replace(MENTION_RE, (_full, name: string) => `@${name}`);
}
