import React, { ErrorInfo, ReactNode } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ERRO CRÍTICO NO NEXUS:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d0e] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#131314] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Activity size={32} className="text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Vixe, algo quebrou!</h1>
              <p className="text-[#8e918f] text-sm leading-relaxed">
                O Nexus IA encontrou um erro inesperado. Não se preocupe, seus dados locais estão seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5f6368] mb-2">Stack Trace</p>
                <p className="text-[11px] font-mono text-red-300/70 break-all overflow-auto max-h-[120px]">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full h-12 bg-white text-black hover:bg-[#e3e3e3] rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reiniciar Estúdio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
