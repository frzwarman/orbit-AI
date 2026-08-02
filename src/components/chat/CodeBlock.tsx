import { useEffect, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

type CodeBlockProps = {
  code: string;
  language: string;
};

const languageNames: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  bash: "Bash",
  shell: "Shell",
  python: "Python",
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const label = (languageNames[language.toLowerCase()] ?? language) || "Plain text";

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="code-block">
      <figcaption className="code-block__header">
        <span>{label}</span>
        <button type="button" onClick={() => void copy()} aria-label={`Copy ${label} code`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} code-block__pre`} style={style} tabIndex={0}>
            {tokens.map((line, lineIndex) => (
              <span key={lineIndex} {...getLineProps({ line })}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
                {"\n"}
              </span>
            ))}
          </pre>
        )}
      </Highlight>
    </figure>
  );
}
