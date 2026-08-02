import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";

import { CodeBlock } from "./CodeBlock";

type MarkdownContentProps = {
  content: string;
};

function MarkdownCode({ className, children, ...props }: ComponentPropsWithoutRef<"code">) {
  const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
  const code = typeof children === "string" ? children.replace(/\n$/, "") : "";
  if (language) return <CodeBlock code={code} language={language} />;
  return <code className={className} {...props}>{children}</code>;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code: MarkdownCode,
          pre: ({ children }) => <>{children}</>,
          a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
