import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

const SAFE = /^(https?:|mailto:)/i;

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [label, setLabel] = useState('Copy');
  const text = String((children as any)?.props?.children ?? '').replace(/\n$/, '');
  return (
    <div className="code">
      <button type="button" className="copy-code" onClick={async () => {
        try { await navigator.clipboard.writeText(text); setLabel('Copied'); } catch { setLabel('Select and copy'); }
        setTimeout(() => setLabel('Copy'), 1800);
      }}>{label}</button>
      <pre>{children}</pre>
    </div>
  );
}

/** Markdown without raw HTML; only http(s)/mailto links; remote images shown as links, never loaded. */
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => (SAFE.test(url) || url.startsWith('#') ? url : '')}
        components={{
          a: ({ href, children }) => href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a> : <span>{children}</span>,
          img: ({ src, alt }) => (src ? <a href={String(src)} target="_blank" rel="noopener noreferrer nofollow">[image: {alt || 'link'}]</a> : null),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >{text}</ReactMarkdown>
    </div>
  );
}
