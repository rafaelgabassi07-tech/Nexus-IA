import React from 'react';

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 space-y-4">
      {icon && <div className="mb-2 text-white/40">{icon}</div>}
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="text-sm max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}
