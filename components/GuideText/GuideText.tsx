import { parseBlocks } from "@/lib/markdown";
import type { Inline } from "@/lib/markdown";

function Text({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((piece, index) =>
        piece.bold ? (
          <strong key={index}>{piece.text}</strong>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </>
  );
}

/**
 * The text of a topic for reading (DESIGN.md: Materials and reading): `###` subsections as
 * headings, paragraphs, bullet and numbered lists and bold, in the body style (16px, line height
 * 1.6). It draws React elements only, never raw HTML.
 */
export function GuideText({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="type-card-title mt-3 first:mt-0">
              {block.text}
            </h2>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index} className="type-body">
              <Text inlines={block.inlines} />
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`type-body flex flex-col gap-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Text inlines={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
