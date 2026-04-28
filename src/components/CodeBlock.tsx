import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';

interface CodeBlockProps {
  language?: string;
  value: string;
  noMargin?: boolean;
  fastMode?: boolean;
}

export const CodeBlock = ({ language, value, noMargin, fastMode }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (fastMode) {
    return (
      <div className={cn(
        "relative group border border-[#1a1b1e] bg-[#0d0d0d] overflow-hidden flex flex-col font-mono text-[13px] h-full", 
        !noMargin && "my-4 rounded-xl shadow-2xl"
      )}>
        <div className="flex-1 overflow-auto p-5 text-[#8e918f]">
          <pre><code className="whitespace-pre-wrap leading-relaxed">{value}</code></pre>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group/code flex flex-col h-full min-w-0 bg-transparent", !noMargin && "my-4")}>
      {!noMargin && (
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center gap-2">
          {language && (
            <span className="text-[10px] font-bold text-[#8e918f] uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/5">
              {language}
            </span>
          )}
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-lg bg-[#2d2e31] border border-white/10 text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="Copiar código"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        PreTag="div"
        showLineNumbers={true}
        lineNumberStyle={{ 
          minWidth: '2.5em', 
          paddingRight: '1em', 
          color: '#5f6368', 
          textAlign: 'right',
          userSelect: 'none',
          fontSize: '12px'
        }}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: noMargin ? '0' : '0.75rem',
          fontSize: '13px',
          background: 'transparent',
          border: 'none',
          lineHeight: '1.7',
          flex: 1,
          height: '100%',
          overflow: 'auto'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};
