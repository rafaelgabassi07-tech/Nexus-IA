import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Carregando...', fullScreen = false }: { text?: string, fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 opacity-50 p-8">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      <p className="text-sm tracking-wide">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
