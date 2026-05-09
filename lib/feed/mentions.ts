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

// Sentinel id used by the admin-only "@cazalumni" mention that broadcasts a
// notification to every alum. Picked as an all-`c` hex string so it parses
// through the same UUID regex as a real profile id.
export const CAZ_ALUMNI_MENTION_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
export const CAZ_ALUMNI_MENTION_NAME = "cazalumni";

export function isCazAlumniMentionId(id: string): boolean {
  return id.toLowerCase() === CAZ_ALUMNI_MENTION_ID;
}

// Removes any `@[name](sentinel-uuid)` markers from content, replacing them
// with the plain `@name` text. Used to defang the broadcast mention on the
// server when a non-admin tries to use it.
export function stripCazAlumniMention(content: string): string {
  const re = new RegExp(
    String.raw`@\[([^\]]{1,80})\]\(${CAZ_ALUMNI_MENTION_ID}\)`,
    "gi",
  );
  return content.replace(re, (_full, name: string) => `@${name}`);
}

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

// Composer-side helper. The textarea holds plain `@Display Name` text plus a
// sidecar list of resolved mentions; on submit we walk each tracked mention
// and rewrite its `@Name` occurrences to the canonical `@[Name](uuid)` form.
// Names are sorted longest-first so a name like "John" never eats the start of
// "Johnny" before its own replacement runs.
export function composeMentions(
  text: string,
  mentions: ReadonlyArray<{ profileId: string; name: string }>,
): string {
  if (mentions.length === 0) return text;
  const sorted = [...mentions].sort((a, b) => b.name.length - a.name.length);
  let out = text;
  for (const m of sorted) {
    const escName = m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match `@Name` only when the next char isn't a continuation of the word
    // — so `@Tester` won't get rewritten as `@Test` + "er".
    const re = new RegExp(`@${escName}(?![A-Za-z0-9])`, "g");
    out = out.replace(re, () => buildMentionMarker(m.profileId, m.name));
  }
  return out;
}

// Returns true if `@Name` (followed by a non-word char or end) still appears
// somewhere in `text`. Used by the composer to drop mentions that the user
// edited away.
export function mentionStillPresent(text: string, name: string): boolean {
  const escName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@${escName}(?![A-Za-z0-9])`).test(text);
}
