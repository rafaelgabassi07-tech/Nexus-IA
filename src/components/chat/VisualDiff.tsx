import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Columns } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VisualDiffProps {
  file: string;
  before: string;
  after: string;
}

export const VisualDiff = ({ file, before, after }: VisualDiffProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState<'split' | 'unified'>('split');

  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  // Simple line-by-line comparison (basic but effective for small changes)
  const renderSplit = () => (
    <div className="grid grid-cols-2 gap-px bg-border/20 overflow-hidden rounded-b-lg">
      <div className="bg-[#0a0a0b] p-3 text-[10px] font-mono overflow-x-auto min-w-0 border-r border-border/10">
        <div className="text-red-400/50 uppercase font-black tracking-widest mb-3 text-[8px]">Original</div>
        {beforeLines.map((line, i) => {
          const isChanged = line !== afterLines[i];
          return (
            <div key={i} className={cn("whitespace-pre min-h-[1.2rem]", isChanged && "bg-red-500/10 -mx-3 px-3 text-red-300")}>
              {line || ' '}
            </div>
          );
        })}
      </div>
      <div className="bg-[#0a0a0b] p-3 text-[10px] font-mono overflow-x-auto min-w-0">
        <div className="text-emerald-400/50 uppercase font-black tracking-widest mb-3 text-[8px]">Refinado</div>
        {afterLines.map((line, i) => {
          const isChanged = line !== beforeLines[i];
          return (
            <div key={i} className={cn("whitespace-pre min-h-[1.2rem]", isChanged && "bg-emerald-500/10 -mx-3 px-3 text-emerald-300")}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="my-4 border border-emerald-500/20 rounded-lg overflow-hidden bg-emerald-500/[0.01] shadow-2xl shadow-black/40">
      <div 
        className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Check size={12} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest leading-none">Auto-Fix Aplicado</div>
            <div className="text-[9px] text-muted-foreground font-bold tracking-tight uppercase opacity-60">Visual Diff: {file.split('/').pop()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === 'split' ? 'unified' : 'split');
              }}
              className="p-1 rounded hover:bg-white/5 transition-colors text-muted-foreground"
            >
              <Columns size={12} className={cn(mode === 'unified' && "opacity-30")} />
            </button>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {renderSplit()}
            <div className="p-2 bg-[#020202] border-t border-border/10 flex items-center justify-between">
               <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 italic">
                 <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500/40 rounded-full" /> Removido</span>
                 <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" /> Adicionado</span>
               </div>
               <div className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80">Refinement Pipeline // Nexus Nexus V1.2</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
