export interface VFSFile {
  type: "file";
  content: string;
  originalContent?: string;
}

export type VFS = Record<string, VFSFile>;

export const defaultFiles: VFS = {};

export function getFileTree(vfs: VFS) {
  const tree: Record<string, any> = {};

  for (const path of Object.keys(vfs)) {
    const parts = path.split("/").filter(Boolean);
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = "file";
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return tree;
}
