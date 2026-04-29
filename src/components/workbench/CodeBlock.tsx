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

  const lineCount = value.split('\n').length;
  const fileSize = (new Blob([value]).size / 1024).toFixed(1);

  return (
    <div className={cn("relative group h-full flex flex-col bg-background", !noMargin && "my-4 rounded-xl overflow-hidden border border-border shadow-2xl")}>
      <div className="h-6 bg-black/40 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Nexus Source View // {language}</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-bold text-muted-foreground uppercase tracking-tighter italic">
          <span className="text-primary/30">Binary Logic</span>
          <span>{lineCount} lines</span>
          <span>{fileSize} KB</span>
        </div>
      </div>

      <div className="absolute right-4 top-10 z-30 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={copyToClipboard}
          className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-muted-foreground hover:text-foreground rounded-xl border border-border transition-all shadow-xl active:scale-95"
        >
          {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-transparent">
        <SyntaxHighlighter
          language={language}
          style={lucario}
          PreTag="pre"
          showLineNumbers={true}
          lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: 'rgba(255,255,255,0.1)', textAlign: 'right', fontSize: '11px', userSelect: 'none' }}
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
