import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FileJson, FileType, FileCode } from 'lucide-react';
import { cn } from '../lib/utils';

type FileNode = {
  name: string;
  type: 'file' | 'folder';
  children?: Record<string, FileNode>;
  originalIndex?: number;
};

const getFileIcon = (fileName: string, isSelected: boolean) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const className = cn("opacity-60", isSelected && "text-[#a8c7fa] opacity-100");
  
  if (['ts', 'tsx'].includes(ext || '')) return <FileType size={14} className={className} />;
  if (['js', 'jsx'].includes(ext || '')) return <FileCode size={14} className={className} />;
  if (['json'].includes(ext || '')) return <FileJson size={14} className={className} />;
  if (['css', 'html'].includes(ext || '')) return <FileCode size={14} className={className} />;
  return <File size={14} className={className} />;
};

export function FileTree({ files, activeFileIndex, onSelect, fullWidth }: { files: {name: string}[], activeFileIndex: number, onSelect: (idx: number) => void, fullWidth?: boolean }) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({'root': true});

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const tree = React.useMemo(() => {
    const root: Record<string, FileNode> = {};
    files.forEach((file, index) => {
      const parts = file.name.split(/[\/\\]/).filter(Boolean);
      let currentLevel = root;
      parts.forEach((part, i) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            type: i === parts.length - 1 ? 'file' : 'folder',
            ...(i === parts.length - 1 ? { originalIndex: index } : { children: {} })
          };
        }
        if (i < parts.length - 1) {
          currentLevel = currentLevel[part].children!;
        }
      });
    });
    return root;
  }, [files]);

  const renderNode = (node: FileNode, path: string, depth: number) => {
    const isExpanded = expandedFolders[path] ?? true;
    const isSelected = node.originalIndex === activeFileIndex;

    return (
      <div key={path} className="relative group/node">
        <div
          className={cn(
            "flex items-center gap-1.5 py-[5px] px-2 cursor-pointer select-none text-[12px] font-mono transition-all group relative border-l-2",
            isSelected 
              ? "bg-blue-500/10 text-blue-100 border-blue-500/50 shadow-[inset_4px_0_10px_rgba(59,130,246,0.1)]" 
              : "text-[#8e918f] border-transparent hover:bg-white/[0.03] hover:text-[#e3e3e3]"
          )}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          onClick={(e) => {
            if (node.type === 'folder') toggleFolder(path, e);
            else if (node.originalIndex !== undefined) onSelect(node.originalIndex);
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /> : <ChevronRight size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
              <Folder size={14} className="text-[#dcb67a]" />
            </>
          ) : (
            <>
              <span className="w-[14px]" />
              {getFileIcon(node.name, isSelected)}
            </>
          )}
          <span className="truncate tracking-tight">{node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="relative">
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map(child => renderNode(child, `${path}/${child.name}`, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "border-r border-white/5 bg-[#0a0b0d] flex flex-col pt-0 pb-24 md:pb-2 overflow-y-auto custom-scrollbar flex-shrink-0 text-muted-foreground shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]",
      fullWidth ? "w-full" : "w-full md:w-64"
    )}>
      {!fullWidth && (
        <div className="px-4 py-3 pb-2 flex items-center justify-between border-b border-white/5 mb-2 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-blue-400/80" />
            <span className="text-[10px] font-black text-[#8e918f] uppercase tracking-[0.2em]">Projeto</span>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      )}
      <div className="pb-4 relative">
        {/* Subtle vertical guide lines */}
        <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-white/[0.03] pointer-events-none" />
        
        {Object.values(tree)
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map(node => renderNode(node, node.name, 0))}
      </div>
    </div>
  );
}
