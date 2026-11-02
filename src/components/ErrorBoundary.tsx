import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🛡️ [Urbix FreezeGuard Interceptor] Error capturado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndRestart = () => {
    try {
      localStorage.removeItem('urbix_session');
      sessionStorage.clear();
    } catch {
      // Ignorar fallo de almacenamiento
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#05080e] text-slate-100 flex items-center justify-center p-4 font-sans select-none">
          <div className="relative max-w-lg w-full bg-[#090d14] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-center space-y-6 overflow-hidden">
            
            {/* Resplandor ambiental de contención */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-28 bg-rose-500/20 blur-3xl pointer-events-none rounded-full" />

            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full">
                SISTEMA DE CONTENCIÓN & BLINDAJE ACTIVO
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Operación Protegida contra Caídas
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                El motor de blindaje Urbix interceptó una anomalía en tiempo de ejecución. 
                Tus datos locales y la conexión con Supabase permanecen a salvo.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#04070d] border border-slate-800 rounded-xl p-3 text-left max-h-32 overflow-y-auto">
                <span className="text-[10px] font-mono text-rose-400 block font-bold">Diagnóstico:</span>
                <p className="text-[11px] font-mono text-slate-400 break-words">
                  {this.state.error.message || 'Error inesperado capturado.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar Vista
              </button>

              <button
                type="button"
                onClick={this.handleClearAndRestart}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                <LogOut className="w-4 h-4" /> Inicio Seguro
              </button>
            </div>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Urbix FreezeGuard v2.5 • Integridad Preservada
              </span>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
