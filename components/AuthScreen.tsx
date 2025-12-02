
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { BRANDING } from '../constants';
import { Key, ArrowRight, Loader2, Database, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simula delay sicurezza
    await new Promise(r => setTimeout(r, 800));

    const result = authService.loginWithToken(token);
    
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setError(result.message || 'Accesso Negato');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00a884] rounded-full blur-[120px] opacity-10"></div>
      
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-12 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-[#00a884]/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-[#00a884]/50">
                <Database className="w-8 h-8 text-[#00a884]" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{BRANDING.appName}</h2>
            <p className="text-slate-400 mt-2 text-sm">Accesso Riservato</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Master Token</label>
              <div className="relative group">
                <Key className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-[#00a884] transition-colors" />
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-[#00a884] focus:border-transparent outline-none transition-all placeholder-slate-600 font-mono tracking-widest"
                  placeholder="TOKEN-ACCESS"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg border border-red-500/20 flex items-center justify-center animate-in shake">
                 <ShieldCheck className="w-4 h-4 mr-2" />
                 {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center transform active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verifica Accesso
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
                {BRANDING.footerText}
            </p>
        </div>
      </div>
    </div>
  );
};
