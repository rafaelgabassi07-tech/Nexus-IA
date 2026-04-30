import { useState, useMemo } from 'react';
import { FileCode, Activity, Layout, Terminal, Box, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';

interface FileTreeProps {
  files: GeneratedFile[];
  activeFilePath: string | null;
  onSelect: (path: string) => void;
}

type TreeNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  fileIndex?: number;
  children?: TreeNode[];
};

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  
  files.forEach((file, index) => {
    // some file.name might start with / or no
    const pathParts = file.name.replace(/^\//, '').split('/');
    let currentLevel = root;
    
    let currentPath = '';

    pathParts.forEach((part, i) => {
      currentPath += (currentPath ? '/' : '') + part;
      const isFile = i === pathParts.length - 1;
      
      let existingNode = currentLevel.find(n => n.name === part && n.type === (isFile ? 'file' : 'folder'));
      
      if (!existingNode) {
        existingNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          ...(isFile ? { fileIndex: index } : { children: [] })
        };
        currentLevel.push(existingNode);
      }
      
      if (!isFile) {
        currentLevel = existingNode.children!;
      }
    });
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach(n => {
      if (n.children) sortNodes(n.children);
    });
  };
  
  sortNodes(root);
  return root;
}

const getIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'tsx' || ext === 'jsx') return <Layout size={14} className="text-primary" />;
  if (ext === 'ts' || ext === 'js') return <FileCode size={14} className="text-primary" />;
  if (ext === 'css') return <Activity size={14} className="text-purple-400" />;
  if (ext === 'json') return <Box size={14} className="text-amber-400" />;
  return <Terminal size={14} className="text-muted-foreground" />;
};

const FileTreeNode = ({ 
  node, 
  activeFilePath, 
  onSelect, 
  level = 0
}: { 
  node: TreeNode, 
  activeFilePath: string | null, 
  onSelect: (path: string) => void,
  level?: number 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (node.type === 'folder') {
    return (
      <div className="w-full flex flex-col">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all rounded text-left group"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isOpen ? <ChevronDown size={12} className="opacity-60" /> : <ChevronRight size={12} className="opacity-60" />}
          {isOpen ? <FolderOpen size={14} className="text-blue-400 opacity-80" /> : <Folder size={14} className="text-blue-400 opacity-80" />}
          <span className="text-[12px] font-medium tracking-tight truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => (
              <FileTreeNode 
                key={child.path} 
                node={child} 
                activeFilePath={activeFilePath} 
                onSelect={onSelect} 
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFilePath === node.path;

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        "flex items-center gap-2 py-1.5 hover:bg-muted transition-all rounded text-left group pr-2 w-full",
        isActive ? "bg-muted text-foreground font-semibold" : "text-muted-foreground/80 hover:text-foreground"
      )}
      style={{ paddingLeft: `${level * 12 + 24}px` }}
    >
      <div className={cn(
        "shrink-0 transition-all",
        isActive ? "opacity-100 scale-100" : "opacity-70 group-hover:opacity-100"
      )}>
        {getIcon(node.name)}
      </div>
      <span className={cn(
        "text-[12px] truncate tracking-tight transition-colors",
        isActive ? "text-primary" : ""
      )}>
        {node.name}
      </span>
    </button>
  );
};

export const FileTree = ({ files, activeFilePath, onSelect }: FileTreeProps) => {
  const tree = useMemo(() => buildTree(files), [files]);

  if (!files || files.length === 0) return null;

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden py-2 md:min-w-[200px] border-r border-border">
      <div className="px-4 mb-3 mt-1 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[.3em] italic">Explorador</h3>
          <div className="h-px w-4 bg-primary/20" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
        <div className="flex flex-col">
          {tree.map(node => (
            <FileTreeNode 
              key={node.path} 
              node={node} 
              activeFilePath={activeFilePath} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

