import React, { useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { lucario } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface CodeBlockProps {
  value: string;
  language?: string;
  noMargin?: boolean;
}

export const CodeBlock = React.memo(({ value, language = 'typescript', noMargin }: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value)
        .then(() => {
          setCopied(true);
          toast.success('Código copiado');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          toast.error('Erro ao copiar código');
        });
    }
  };

  return (
    <div className={cn("relative group h-full flex flex-col bg-[#0b0c0e]", !noMargin && "my-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl")}>
      <div className="absolute right-4 top-4 z-30 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={copyToClipboard}
          className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white/50 hover:text-white rounded-xl border border-white/10 transition-all shadow-xl active:scale-95"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-transparent">
        <SyntaxHighlighter
          language={language}
          style={lucario}
          PreTag="pre"
          ref={preRef as any}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
            minHeight: '100%',
            width: '100%',
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
});
