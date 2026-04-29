import { useState } from 'react';
import { FileCode, Activity, Layout, Terminal, Box, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';

interface FileTreeProps {
  files: GeneratedFile[];
  activeFileIndex: number;
  onSelect: (index: number) => void;
}

export const FileTree = ({ files, activeFileIndex, onSelect }: FileTreeProps) => {
  const [search, setSearch] = useState('');

  if (!files || files.length === 0) return null;

  const filteredFiles = files
    .map((f, i) => ({ ...f, originalIndex: i }))
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const getIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'tsx' || ext === 'jsx') return <Layout size={14} className="text-blue-400" />;
    if (ext === 'ts' || ext === 'js') return <FileCode size={14} className="text-emerald-400" />;
    if (ext === 'css') return <Activity size={14} className="text-purple-400" />;
    if (ext === 'json') return <Box size={14} className="text-amber-400" />;
    return <Terminal size={14} className="text-[#8e918f]" />;
  };

  return (
    <div className="w-full h-full flex flex-col bg-background/50 backdrop-blur-xl overflow-hidden py-2 md:min-w-[200px]">
      <div className="px-4 mb-3 mt-1 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] font-black text-[#4a4d51] uppercase tracking-[.3em] italic">Manifest Core</h3>
          <div className="h-px w-4 bg-blue-500/20" />
        </div>
        
        <div className="relative group">
          <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER ASSETS..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-7 bg-white/[0.02] border border-white/5 rounded-md pl-8 pr-8 text-[10px] font-bold text-white/50 focus:outline-none focus:border-blue-500/30 placeholder:text-white/5 uppercase tracking-tighter transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
              <X size={10} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-px px-1.5">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <button
              key={file.name + file.originalIndex}
              onClick={() => onSelect(file.originalIndex)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-left group",
                activeFileIndex === file.originalIndex 
                  ? "bg-white/[0.04] text-white border border-white/5 active-file-shadow" 
                  : "text-[#8e918f]/60 hover:bg-white/[0.02] border border-transparent"
              )}
            >
              <div className={cn(
                "shrink-0 transition-all duration-300",
                activeFileIndex === file.originalIndex ? "opacity-100 scale-100" : "opacity-40 group-hover:opacity-100 group-hover:scale-105"
              )}>
                {getIcon(file.name)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={cn(
                  "text-[12px] font-bold truncate tracking-tight transition-colors",
                  activeFileIndex === file.originalIndex ? "text-white/90" : "group-hover:text-white/70"
                )}>
                  {file.name.split('/').pop()}
                </span>
                <span className="text-[8px] font-black opacity-30 uppercase tracking-[.15em] mt-0.5 italic">
                  {file.name.split('/').length > 1 ? file.name.split('/').slice(0, -1).join('/') : 'ROOT'}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="py-10 flex flex-col items-center justify-center opacity-20 text-center px-4">
            <Search size={20} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">No match detected</span>
          </div>
        )}
      </div>
    </div>
  );
};
