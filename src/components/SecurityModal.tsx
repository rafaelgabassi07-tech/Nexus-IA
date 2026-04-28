import { X, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../store/appStore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal = ({ isOpen, onClose }: SecurityModalProps) => {
  const { securityRules, setSecurityRules } = useSettingsStore();

  const toggleRule = (id: string) => {
    setSecurityRules(securityRules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    setSecurityRules(securityRules.filter(r => r.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-tight">Regras de segurança</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8e918f] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#e3e3e3] mb-3">Regras ativas</h3>
            <div className="space-y-3">
              {securityRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
                  <button onClick={() => toggleRule(rule.id)} className="shrink-0 outline-none">
                    <div className={cn(
                      "w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300",
                      rule.active ? "bg-emerald-500/20" : "bg-white/10"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center",
                        rule.active ? "bg-emerald-400 translate-x-5" : "bg-white/40 translate-x-0"
                      )}>
                        {rule.active && <div className="w-1.5 h-1.5 rounded-full bg-[#121212]" />}
                      </div>
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-medium text-[#f1f3f4] truncate">{rule.name}</h4>
                    <p className="text-[13px] text-[#8e918f] font-mono truncate mt-0.5">{rule.pattern}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className={cn(
                      "px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider",
                      rule.action === 'warn' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {rule.action}
                    </div>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="text-[#8e918f] hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {securityRules.length === 0 && (
                <div className="text-center py-6 text-[#8e918f] text-sm">Nenhuma regra configurada.</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
