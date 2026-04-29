import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export * from './storage';
export * from './tokenizer';
export * from './markdown';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15);
  }
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function deriveChatTitle(content: string): string {
  if (!content) return "Novo Protocolo";
  // Remove code blocks
  const cleanContent = content.replace(/```[\s\S]*?```/g, "").trim();
  if (!cleanContent) return "Código de Matriz";
  const title = cleanContent.split('\n')[0].slice(0, 40).trim();
  return title + (cleanContent.length > title.length ? "..." : "");
}

