import { CodeBlock } from "@/components/shared/code-block";
import { RichText } from "@/components/shared/rich-text";
import type { PostBlock } from "@/lib/post-html";

/** Post body: rich text with Shiki-highlighted code blocks (server-rendered). */
export function PostContent({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {blocks.map((block, i) =>
        block.kind === "code" ? (
          <CodeBlock key={i} code={block.code} lang={block.lang} />
        ) : (
          <RichText key={i} html={block.html} className="[&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24" />
        ),
      )}
    </div>
  );
}
