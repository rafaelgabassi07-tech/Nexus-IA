import React from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface CodeBlockProps {
  value: string;
  language?: string;
  noMargin?: boolean;
}

export const CodeBlock = React.memo(({ value, language = 'typescript', noMargin }: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);

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

  // Mapping languages for Monaco
  const monacoLanguage = language === 'jsx' ? 'javascript' : language === 'tsx' ? 'typescript' : language;

  return (
    <div className={cn("relative group h-full flex flex-col bg-[#0d0d0d]", !noMargin && "my-4 rounded-xl overflow-hidden border border-border shadow-2xl")}>
      <div className="h-7 bg-muted border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={10} className="text-primary opacity-60" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Nexus Intelligence IDE // {language}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter italic">
          <div className="flex items-center gap-1 text-primary">
            <Zap size={10} />
            <span>Active Agent Analysis</span>
          </div>
          <span className="opacity-40">{lineCount} lines</span>
          <span className="opacity-40">{fileSize} KB</span>
        </div>
      </div>

      <div className="absolute right-6 top-12 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={copyToClipboard}
            className="p-2 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-all shadow-xl active:scale-95"
            title="Copiar Código"
          >
            {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#0d0d0d]">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          theme="vs-dark"
          options={{
            readOnly: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            overviewRulerBorder: false,
            contextmenu: true,
            // Intelligence Features
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: { enabled: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            folding: true,
            lineDecorationsWidth: 10,
            mouseWheelZoom: true,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
          }}
          loading={
            <div className="h-full flex items-center justify-center bg-[#0d0d0d] text-muted-foreground animate-pulse text-[10px] font-black uppercase tracking-widest">
              Arquitetando Nexus Interface...
            </div>
          }
        />
      </div>
      
      <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">UTF-8</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">LF</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Nexus Linter [OK]</span>
        </div>
      </div>
    </div>
  );
});
