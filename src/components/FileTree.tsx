import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

type FileNode = {
  name: string;
  type: 'file' | 'folder';
  children?: Record<string, FileNode>;
  originalIndex?: number;
};

export function FileTree({ files, activeFileIndex, onSelect }: { files: {name: string}[], activeFileIndex: number, onSelect: (idx: number) => void }) {
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
      <div key={path}>
        <div
          className={cn(
            "flex items-center gap-1.5 py-1.5 px-3 cursor-pointer select-none text-[12px] transition-colors group",
            isSelected ? "bg-[#1a1b1e] text-[#e3e3e3] border-r-2 border-[#a8c7fa]" : "text-[#8e918f] hover:bg-white/[0.02] hover:text-[#e3e3e3]"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={(e) => {
            if (node.type === 'folder') toggleFolder(path, e);
            else if (node.originalIndex !== undefined) onSelect(node.originalIndex);
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
              <Folder size={14} className="text-[#a8c7fa] opacity-80" />
            </>
          ) : (
            <>
              <span className="w-[14px]" />
              <File size={13} className={cn("opacity-60", isSelected && "text-[#a8c7fa] opacity-100")} />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
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
    <div className="w-60 border-r border-[#1a1b1e] bg-[#0c0c0d] flex flex-col py-2 overflow-y-auto custom-scrollbar flex-shrink-0">
      <div className="px-4 py-2 mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black text-[#5f6368] uppercase tracking-widest">Explorador</span>
      </div>
      <div className="pb-4">
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
