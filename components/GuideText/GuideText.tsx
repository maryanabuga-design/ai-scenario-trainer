import { applyHighlights } from "@/lib/highlights";
import type { Highlight } from "@/lib/highlights";
import { parseBlocks } from "@/lib/markdown";
import type { Inline } from "@/lib/markdown";

/** The pieces of one block; the highlights of the block are drawn as <mark> around their parts. */
function Text({ inlines, highlights }: { inlines: Inline[]; highlights: Highlight[] }) {
  return (
    <>
      {applyHighlights(inlines, highlights).map((segment, index) => {
        const node = segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        );
        return segment.mark ? (
          <mark
            key={index}
            data-highlight={segment.mark}
            className="cursor-pointer rounded-[3px] bg-highlight text-text [box-decoration-break:clone]"
          >
            {node}
          </mark>
        ) : (
          node
        );
      })}
    </>
  );
}

/**
 * The text of a topic for reading (DESIGN.md: Materials and reading): `###` subsections as
 * headings, paragraphs, bullet and numbered lists and bold, in the body style (16px, line height
 * 1.6). It draws React elements only, never raw HTML.
 */
export function GuideText({
  markdown,
  highlights = [],
}: {
  markdown: string;
  /** The highlights of this topic, placed on the blocks (a paragraph or a list item each). */
  highlights?: Highlight[];
}) {
  const blocks = parseBlocks(markdown);
  let counter = 0;
  const own = (index: number) => highlights.filter((highlight) => highlight.block === index);
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
          const at = counter++;
          return (
            <p key={index} data-block={at} className="type-body">
              <Text inlines={block.inlines} highlights={own(at)} />
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`type-body flex flex-col gap-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
          >
            {block.items.map((item, itemIndex) => {
              const at = counter++;
              return (
                <li key={itemIndex} data-block={at}>
                  <Text inlines={item} highlights={own(at)} />
                </li>
              );
            })}
          </List>
        );
      })}
    </div>
  );
}
