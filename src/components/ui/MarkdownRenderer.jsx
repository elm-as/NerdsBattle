import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MathText from './MathText.jsx';
import MathGraphCard from './MathGraphCard.jsx';

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

// Composant paragraphe avec espacement respirant
const Paragraph = ({ children }) => {
  return <p className="mb-4 leading-relaxed text-ink-soft dark:text-slate-200 break-words">{processWithMathText(children)}</p>;
};

// Titre avec style et icône + support LaTeX
const Heading = ({ level, children }) => {
  const baseClasses = "font-display font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight break-words";
  const sizes = {
    1: "text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 text-brand",
    2: "text-xl text-slate-900 dark:text-slate-100",
    3: "text-lg text-slate-800 dark:text-slate-200",
    4: "text-base font-semibold",
    5: "text-sm font-semibold",
    6: "text-xs font-semibold uppercase tracking-wider"
  };
  
  const Tag = `h${level}`;
  return <Tag className={`${baseClasses} ${sizes[level]}`}>{processWithMathText(children)}</Tag>;
};

// Liste à puces avec style moderne
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
    <li className="text-ink-soft dark:text-slate-200 pl-1 leading-relaxed">
      {processWithMathText(children)}
    </li>
  );
};

// Texte en gras + support LaTeX
const Strong = ({ children }) => {
  return (
    <strong className="font-bold text-slate-900 dark:text-white">
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
  <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-xs sm:text-sm font-mono text-brand font-semibold border border-slate-200/60 dark:border-slate-700/60">
    {children}
  </code>
);

// Bloc de code ou graphique mathématique
const CodeBlock = ({ children, className }) => {
  const language = className ? className.replace('language-', '').trim() : '';

  // Interception spéciale pour mathgraph (modélisation de courbes mathématiques)
  if (language === 'mathgraph') {
    const rawCode = Array.isArray(children) ? children.join('') : String(children);
    return <MathGraphCard code={rawCode} />;
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {language && (
        <div className="px-3.5 py-1.5 bg-slate-200/80 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono font-semibold uppercase tracking-wider">
          {language}
        </div>
      )}
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed scrollbar-none">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// Citation stylisée avec accent brand
const Blockquote = ({ children }) => (
  <blockquote className="border-l-4 border-brand pl-4 py-2.5 my-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-r-xl italic text-slate-700 dark:text-slate-300 leading-relaxed">
    {children}
  </blockquote>
);

// Lien
const Link = ({ href, children }) => (
  <a 
    href={href} 
    className="text-brand hover:text-brand-400 font-semibold underline underline-offset-2 transition-colors"
    target="_blank" 
    rel="noopener noreferrer"
  >
    {children}
  </a>
);

// Séparateur horizontal
const ThematicBreak = () => (
  <hr className="my-6 border-t border-slate-200 dark:border-slate-800" />
);

// Tableau responsive
const Table = ({ children }) => (
  <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <table className="w-full text-xs sm:text-sm">
      {children}
    </table>
  </div>
);

const TableHead = ({ children }) => (
  <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800">
    {children}
  </thead>
);

const TableBody = ({ children }) => (
  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
    {children}
  </tbody>
);

const TableRow = ({ children }) => (
  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">{children}</tr>
);

const TableCell = ({ children }) => {
  return (
    <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">
      {processWithMathText(children)}
    </td>
  );
};

const TableHeader = ({ children }) => {
  return (
    <th className="px-3.5 py-2.5 text-left font-display font-bold text-slate-900 dark:text-white">
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

/**
 * Normalise défensivement le markdown pour garantir le parsing des tables GFM
 * et éliminer les scories d'échappement (trailing backslashes, etc.)
 */
function sanitizeMarkdownContent(raw) {
  if (typeof raw !== 'string' || !raw) return ''

  let s = raw.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n')

  // Corriger les artefacts d'échappement accidentel (\t -> tab, \n -> newline sur LaTeX)
  s = s.replace(/\t(imes\b)/g, '\\t$1')
  s = s.replace(/\t(ext\b)/g, '\\t$1')
  s = s.replace(/\t(an\b)/g, '\\t$1')
  s = s.replace(/\t(heta\b)/g, '\\t$1')
  s = s.replace(/\t(au\b)/g, '\\t$1')
  s = s.replace(/\t(o\b)/g, '\\t$1')

  s = s.replace(/\\\s*\n\s*eq\b/g, '\\neq ')
  s = s.replace(/\\\s*\n\s*u\b/g, '\\nu ')
  s = s.replace(/\\\s*\n\s*rightarrow\b/g, '\\rightarrow ')

  // Dé-doubler les backslashes devant les commandes LaTeX standard
  s = s.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1')

  // Nettoyer les trailing backslashes ligne par ligne
  const lines = s.split('\n')
  const cleanedLines = []
  let inMultilineLatex = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (line.includes('\\begin{') && !line.includes('\\end{')) {
      inMultilineLatex = true
    } else if (line.includes('\\end{')) {
      inMultilineLatex = false
    }

    if (/^\s*\\+\s*$/.test(line)) {
      cleanedLines.push('')
      continue
    }

    if (/^\s*\|.*\|\s*\\+\s*$/.test(line)) {
      line = line.replace(/\|\s*\\+\s*$/, '|')
    } else if (/\$\$\s*\\+\s*$/.test(line)) {
      line = line.replace(/\$\$\s*\\+\s*$/, '$$')
    } else if (!inMultilineLatex) {
      line = line.replace(/([^\\])\\+$/, '$1').trimEnd()
    }

    cleanedLines.push(line)
  }

  s = cleanedLines.join('\n')

  // Normaliser les tableaux GFM : ligne vide obligatoire avant et après
  s = s.replace(/([^\n])\n(\|[^\n]+\|\r?\n\|[-:| ]+\|)/g, '$1\n\n$2')
  s = s.replace(/(\|[^\n]+\|)\n([^\n|#\s])/g, '$1\n\n$2')

  s = s.replace(/\n\s*\\+\s*\n/g, '\n\n')

  return s
}

export default function MarkdownRenderer({ content, className = '', fontSize = 'base' }) {
  if (!content) return null;

  const fontClasses = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  };

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

  const normalizedContent = sanitizeMarkdownContent(content);

  return (
    <div className={`prose max-w-none dark:prose-invert leading-relaxed break-words overflow-x-hidden ${fontClasses[fontSize] || fontClasses.base} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

