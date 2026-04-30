import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Terminal } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full">
            <div className="bg-card border border-red-500/20 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
              {/* Background Accents */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2 shadow-inner group">
                   <AlertTriangle size={40} className="group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-[32px] font-black text-foreground uppercase tracking-tighter italic leading-none">
                    Distorção na Matriz
                  </h1>
                  <p className="text-[14px] text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto opacity-80">
                    Ocorreu um erro crítico na orquestração visual do Nexus. Os sistemas de segurança foram ativados.
                  </p>
                </div>

                <div className="w-full p-4 bg-black/40 border border-border rounded-2xl text-left overflow-hidden">
                   <div className="flex items-center gap-2 mb-2">
                      <Terminal size={14} className="text-red-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Error Debug</span>
                   </div>
                   <p className="text-[11px] font-mono text-red-400/80 break-all line-clamp-3 leading-relaxed bg-red-400/5 p-3 rounded-xl border border-red-400/10">
                     {this.state.error?.message || 'Erro desconhecido de renderização'}
                   </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                   <Button 
                    onClick={() => window.location.reload()}
                    className="flex-1 h-14 bg-red-600 hover:bg-red-500 text-foreground rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-red-600/20 transition-all active:scale-95"
                   >
                     <RefreshCw size={16} className="mr-3" /> Reiniciar Nexus
                   </Button>
                   <Button 
                    variant="ghost"
                    onClick={() => window.location.href = '/'}
                    className="flex-1 h-14 bg-muted hover:bg-white/10 text-foreground rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all border border-border active:scale-95"
                   >
                     <Home size={16} className="mr-3" /> Voltar ao Início
                   </Button>
                </div>
              </div>
            </div>
            
            <p className="text-center mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
              Protocolo de Emergência Nexus Alpha
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
