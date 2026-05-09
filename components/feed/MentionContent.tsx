import Link from "next/link";
import { Fragment } from "react";
import { isCazAlumniMentionId, parseMentionTokens } from "@/lib/feed/mentions";

export function MentionContent({ content }: { content: string }) {
  const tokens = parseMentionTokens(content);
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-caz-ink)]">
      {tokens.map((tok, i) =>
        tok.kind === "mention" ? (
          isCazAlumniMentionId(tok.profileId) ? (
            <span
              key={i}
              title="Notifies every alum"
              className="inline-flex items-center rounded-full bg-[var(--color-caz-gold)]/20 px-2 py-0.5 font-semibold text-[var(--color-caz-green-darker)]"
            >
              @{tok.name}
            </span>
          ) : (
            <Link
              key={i}
              href={`/directory/${tok.profileId}`}
              className="font-medium text-[var(--color-caz-green-dark)] hover:underline"
            >
              @{tok.name}
            </Link>
          )
        ) : (
          <Fragment key={i}>{tok.text}</Fragment>
        ),
      )}
    </p>
  );
}
