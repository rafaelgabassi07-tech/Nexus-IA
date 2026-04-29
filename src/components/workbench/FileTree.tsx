import { FileCode, Activity, Layout, Terminal, Box } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';

interface FileTreeProps {
  files: GeneratedFile[];
  activeFileIndex: number;
  onSelect: (index: number) => void;
}

export const FileTree = ({ files, activeFileIndex, onSelect }: FileTreeProps) => {
  if (!files || files.length === 0) return null;

  const getIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'tsx' || ext === 'jsx') return <Layout size={14} className="text-blue-400" />;
    if (ext === 'ts' || ext === 'js') return <FileCode size={14} className="text-emerald-400" />;
    if (ext === 'css') return <Activity size={14} className="text-purple-400" />;
    if (ext === 'json') return <Box size={14} className="text-amber-400" />;
    return <Terminal size={14} className="text-[#8e918f]" />;
  };

  // Group files by directory if needed, but for now simple list with indentation
  return (
    <div className="w-full h-full flex flex-col bg-background/50 backdrop-blur-xl overflow-y-auto py-2 custom-scrollbar md:min-w-[200px]">
      <div className="px-5 mb-4 mt-2">
        <h3 className="text-[10px] font-black text-[#4a4d51] uppercase tracking-[0.2em] mb-1">Arquitetura</h3>
        <div className="h-0.5 w-6 bg-blue-500/20 rounded-full" />
      </div>
      
      <div className="space-y-0.5 px-2">
        {files.map((file, index) => (
          <button
            key={file.name + index}
            onClick={() => onSelect(index)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-left group",
              activeFileIndex === index 
                ? "bg-blue-500/10 text-white border border-blue-500/20 shadow-inner" 
                : "text-[#8e918f] hover:bg-white/[0.03] border border-transparent"
            )}
          >
            <div className={cn(
              "shrink-0 transition-transform duration-300",
              activeFileIndex === index ? "scale-110" : "group-hover:scale-110"
            )}>
              {getIcon(file.name)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "text-[13px] font-bold truncate tracking-tight transition-colors",
                activeFileIndex === index ? "text-white" : "group-hover:text-[#f1f3f4]"
              )}>
                {file.name.split('/').pop()}
              </span>
              <span className="text-[9px] font-medium opacity-40 uppercase tracking-widest mt-0.5">
                {file.name.split('/').length > 1 ? file.name.split('/').slice(0, -1).join('/') : 'ROOT'}
              </span>
            </div>
            
            {activeFileIndex === index && (
              <div className="ml-auto w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
