import Link from "next/link";
import { Fragment } from "react";
import { parseMentionTokens } from "@/lib/feed/mentions";

export function MentionContent({ content }: { content: string }) {
  const tokens = parseMentionTokens(content);
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-caz-ink)]">
      {tokens.map((tok, i) =>
        tok.kind === "mention" ? (
          <Link
            key={i}
            href={`/directory/${tok.profileId}`}
            className="font-medium text-[var(--color-caz-green-dark)] hover:underline"
          >
            @{tok.name}
          </Link>
        ) : (
          <Fragment key={i}>{tok.text}</Fragment>
        ),
      )}
    </p>
  );
}
