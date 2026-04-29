import { 
  ShieldCheck, Info, ExternalLink, X, Lock, 
  Server, Globe, Database, Terminal
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal = ({ isOpen, onClose }: SecurityModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0d0d0e] border-white/20 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative">
          {/* Header Visual */}
          <div className="h-32 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent relative overflow-hidden flex items-center px-8 border-b border-white/20">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={120} strokeWidth={1} />
             </div>
             <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                   <Lock size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocolo de Segurança</span>
                </div>
                <DialogTitle className="text-[22px] md:text-[28px] font-black tracking-tighter italic uppercase">Arquitetura Privada</DialogTitle>
             </div>
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
             >
                <X size={20} />
             </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/20 space-y-3 hover:bg-white/[0.03] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Database size={20} /></div>
                  <h4 className="text-[14px] font-bold text-white tracking-tight">Persistência Local</h4>
                  <p className="text-[12px] text-white/80 leading-relaxed font-medium">Seus dados sensíveis são armazenados exclusivamente no seu navegador via <span className="text-white">IndexedDB Seguro</span>.</p>
               </div>
               <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/20 space-y-3 hover:bg-white/[0.03] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Server size={20} /></div>
                  <h4 className="text-[14px] font-bold text-white tracking-tight">Transmissão Blindada</h4>
                  <p className="text-[12px] text-white/80 leading-relaxed font-medium">Atuamos como uma ponte de fluxo. <span className="text-white">Nenhum dado é persistido em nossos servidores.</span></p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2">
                 <Info size={16} className="text-blue-400" />
                 <h4 className="text-[12px] font-black uppercase tracking-widest text-white/80">Diretrizes de Segurança</h4>
               </div>
               
               <div className="space-y-3">
                  {[
                    { icon: Globe, label: "Comunicações TLS 1.3", desc: "Toda troca de dados com o Google AI Studio é criptografada fim-a-fim." },
                    { icon: Terminal, label: "Execução em Sandbox", desc: "O preview no canvas roda em um ecossistema isolado do sistema principal." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-white/20 bg-white/[0.01]">
                       <div className="shrink-0 text-[#4a4d51] mt-1"><item.icon size={18} /></div>
                       <div className="space-y-1">
                          <p className="text-[13px] font-bold text-white/90">{item.label}</p>
                          <p className="text-[11px] text-[#8e918f] font-medium leading-relaxed">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl flex items-center justify-between gap-6">
               <p className="text-[11px] text-[#8e918f] font-medium max-w-[300px]">Para mais detalhes sobre como o Google processa seus dados via API, consulte a documentação oficial.</p>
               <a 
                href="https://ai.google.dev/gemini-api/terms" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors shrink-0"
               >
                 Termos <ExternalLink size={14} />
               </a>
            </div>
          </div>

          <div className="p-6 bg-black/40 border-t border-white/20 flex justify-end">
             <Button onClick={onClose} className="w-full md:w-auto px-10 h-11 bg-white hover:bg-white/90 text-black rounded-xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-transform active:scale-95">Compreendido</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
