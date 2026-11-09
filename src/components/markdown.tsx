import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Model answers are untrusted text. react-markdown builds React elements from the Markdown and
// never inserts raw HTML: a <script> in an answer is shown as text. Unsafe link protocols
// (javascript:, data:) are removed by its default URL filter.
const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
