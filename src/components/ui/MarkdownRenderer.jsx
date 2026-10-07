import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MathText from './MathText';

// Fonction utilitaire pour traiter tous les children avec MathText
const processWithMathText = (children) => {
  if (typeof children === 'string') {
    return <MathText>{children}</MathText>;
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => 
      typeof child === 'string' ? <MathText key={i}>{child}</MathText> : child
    );
  }
  return children;
};

// Composant personnalisé pour rendre le texte avec support LaTeX
const Paragraph = ({ children }) => {
  return <p className="mb-3">{processWithMathText(children)}</p>;
};

// Titre avec style et icône + support LaTeX
const Heading = ({ level, children }) => {
  const baseClasses = "font-display font-bold text-ink-dark dark:text-slate-100 mt-6 mb-3";
  const sizes = {
    1: "text-2xl border-b-2 border-brand/20 pb-2",
    2: "text-xl text-brand",
    3: "text-lg",
    4: "text-base",
    5: "text-sm",
    6: "text-xs"
  };
  
  const Tag = `h${level}`;
  return <Tag className={`${baseClasses} ${sizes[level]}`}>{processWithMathText(children)}</Tag>;
};

// Liste à puces avec style amélioré
const UnorderedList = ({ children }) => (
  <ul className="list-disc list-inside space-y-2 mb-4 ml-2 marker:text-brand">
    {children}
  </ul>
);

// Liste ordonnée
const OrderedList = ({ children }) => (
  <ol className="list-decimal list-inside space-y-2 mb-4 ml-2 marker:text-brand marker:font-semibold">
    {children}
  </ol>
);

// Élément de liste avec support LaTeX
const ListItem = ({ children }) => {
  return (
    <li className="text-ink-soft dark:text-slate-300 pl-2">
      {processWithMathText(children)}
    </li>
  );
};

// Texte en gras + support LaTeX
const Strong = ({ children }) => {
  return (
    <strong className="font-bold text-ink-dark dark:text-slate-100">
      {processWithMathText(children)}
    </strong>
  );
};

// Texte en italique + support LaTeX
const Emphasis = ({ children }) => {
  return (
    <em className="italic text-ink-soft dark:text-slate-300">
      {processWithMathText(children)}
    </em>
  );
};

// Code inline
const InlineCode = ({ children }) => (
  <code className="bg-surface-2 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-brand">
    {children}
  </code>
);

// Bloc de code
const CodeBlock = ({ children, className }) => {
  const language = className ? className.replace('language-', '') : '';
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-surface-2 dark:bg-slate-900">
      {language && (
        <div className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
          {language}
        </div>
      )}
      <pre className="p-3 overflow-x-auto text-sm font-mono text-ink-soft dark:text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// Citation
const Blockquote = ({ children }) => (
  <blockquote className="border-l-4 border-brand pl-4 py-2 my-4 bg-surface-2 dark:bg-slate-800/50 rounded-r italic">
    {children}
  </blockquote>
);

// Lien
const Link = ({ href, children }) => (
  <a 
    href={href} 
    className="text-brand hover:text-brand-light underline transition-colors"
    target="_blank" 
    rel="noopener noreferrer"
  >
    {children}
  </a>
);

// Séparateur horizontal
const ThematicBreak = () => (
  <hr className="my-6 border-t-2 border-surface-2 dark:border-slate-700" />
);

// Tableau
const Table = ({ children }) => (
  <div className="overflow-x-auto my-4 rounded-lg border border-surface-2 dark:border-slate-700">
    <table className="w-full text-sm">
      {children}
    </table>
  </div>
);

const TableHead = ({ children }) => (
  <thead className="bg-surface-2 dark:bg-slate-800">
    {children}
  </thead>
);

const TableBody = ({ children }) => (
  <tbody className="divide-y divide-surface-2 dark:divide-slate-700">
    {children}
  </tbody>
);

const TableRow = ({ children }) => (
  <tr>{children}</tr>
);

const TableCell = ({ children }) => {
  return (
    <td className="px-3 py-2 text-ink-soft dark:text-slate-300">
      {processWithMathText(children)}
    </td>
  );
};

const TableHeader = ({ children }) => {
  return (
    <th className="px-3 py-2 text-left font-semibold text-ink-dark dark:text-slate-100">
      {processWithMathText(children)}
    </th>
  );
};

// Composant pour le texte qui détecte le LaTeX
const Text = ({ children }) => {
  if (typeof children === 'string') {
    return <MathText>{children}</MathText>;
  }
  return <>{children}</>;
};

// Composant pour wrapper le contenu avec le support LaTeX
const MarkdownSpan = ({ children }) => {
  if (typeof children === 'string') {
    return <MathText>{children}</MathText>;
  }
  return <span>{children}</span>;
};

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const components = {
    p: Paragraph,
    h1: (props) => <Heading {...props} level={1} />,
    h2: (props) => <Heading {...props} level={2} />,
    h3: (props) => <Heading {...props} level={3} />,
    h4: (props) => <Heading {...props} level={4} />,
    h5: (props) => <Heading {...props} level={5} />,
    h6: (props) => <Heading {...props} level={6} />,
    ul: UnorderedList,
    ol: OrderedList,
    li: ListItem,
    strong: Strong,
    em: Emphasis,
    code: ({ inline, children, className }) => 
      inline ? <InlineCode>{children}</InlineCode> : <CodeBlock className={className}>{children}</CodeBlock>,
    blockquote: Blockquote,
    a: Link,
    hr: ThematicBreak,
    table: Table,
    thead: TableHead,
    tbody: TableBody,
    tr: TableRow,
    td: TableCell,
    th: TableHeader,
    text: Text,
    span: MarkdownSpan,
  };

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
