import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center">
            <h2 className="text-2xl font-serif mb-4 text-red-600">Ups! Ceva nu a mers bine.</h2>
            <p className="text-neutral-500 text-sm mb-8">
              Am întâmpinat o eroare neașteptată. Te rugăm să reîncarci pagina sau să încerci mai târziu.
            </p>
            {(import.meta.env?.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('dev-')))) && (
              <pre className="text-[10px] text-left bg-neutral-100 p-4 rounded-xl overflow-auto mb-8 max-h-40">
                {this.state.error?.message}
              </pre>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
            >
              Reîncarcă Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
