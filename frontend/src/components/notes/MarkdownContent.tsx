'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props { content: string; className?: string; }

export default function MarkdownContent({ content, className = '' }: Props) {
  if (!content) return <span className="italic text-ink-400">No content</span>;

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none
      prose-headings:font-display prose-headings:text-ink-900 dark:prose-headings:text-cream-100
      prose-p:text-ink-600 dark:prose-p:text-ink-300 prose-p:leading-relaxed
      prose-a:text-amber-accent prose-a:no-underline hover:prose-a:underline
      prose-code:bg-cream-100 dark:prose-code:bg-ink-700 prose-code:px-1.5 prose-code:py-0.5
      prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-ink-900 dark:prose-pre:bg-ink-950 prose-pre:rounded-xl
      prose-blockquote:border-amber-accent prose-blockquote:text-ink-500
      prose-strong:text-ink-800 dark:prose-strong:text-cream-200
      prose-li:text-ink-600 dark:prose-li:text-ink-300
      ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
