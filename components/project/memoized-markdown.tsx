import { marked } from "marked";
import { memo, useMemo } from "react";
import { MarkdownHooks } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import rehypePrettyCode from "rehype-pretty-code";
import { transformerCopyButton } from "@rehype-pretty/transformers";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <MarkdownHooks
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypePrettyCode,
            {
              theme: {
                dark: "github-dark-default",
                light: "github-light-default",
              },
              transformers: [
                transformerCopyButton({
                  visibility: "always",
                  feedbackDuration: 3_000,
                }),
              ],
            },
          ],
        ]}
      >
        {content}
      </MarkdownHooks>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
