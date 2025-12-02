import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Database, ArrowRight, ShieldCheck, AlertTriangle, ExternalLink, Code } from 'lucide-react';

interface DatabaseConfigScreenProps {
  onConfigured: () => void;
}

export const DatabaseConfigScreen: React.FC<DatabaseConfigScreenProps> = ({ onConfigured }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [showSql, setShowSql] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (supabaseService.init(url, key)) {
      onConfigured();
    } else {
      setError("Configurazione non valida. Controlla URL e Key.");
    }
  };

  const sqlScript = `create table bot_nodes (
  id text primary key,
  user_token text not null,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Info */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-8 text-white md:w-1/2 flex flex-col justify-between">
            <div>
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <Database className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Cloud Database</h2>
                <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                    Per rendere i tuoi bot accessibili da qualsiasi PC, abbiamo bisogno di un database Cloud.
                    Usiamo <strong>Supabase</strong> (Gratuito e Sicuro).
                </p>
                <ul className="space-y-3 text-sm text-emerald-50">
                    <li className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Dati Crittografati</li>
                    <li className="flex items-center"><ExternalLink className="w-4 h-4 mr-2" /> Sync in Tempo Reale</li>
                    <li className="flex items-center"><Database className="w-4 h-4 mr-2" /> Backup Automatico</li>
                </ul>
            </div>
            <div className="mt-8">
                <button 
                    onClick={() => setShowSql(!showSql)}
                    className="text-xs font-mono bg-black/20 hover:bg-black/30 px-3 py-2 rounded text-emerald-200 flex items-center transition-colors"
                >
                    <Code className="w-3 h-3 mr-2" />
                    {showSql ? 'Nascondi SQL' : 'Mostra Script SQL'}
                </button>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:w-1/2 bg-slate-50 flex flex-col justify-center">
            
            {showSql ? (
                <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-emerald-400 overflow-x-auto relative animate-in fade-in">
                    <pre>{sqlScript}</pre>
                    <button onClick={() => setShowSql(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">Chiudi</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Collega Progetto</h3>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Project URL</label>
                        <input 
                            type="text" 
                            required
                            placeholder="https://xyz.supabase.co"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Anon Public Key</label>
                        <input 
                            type="password" 
                            required
                            placeholder="eyJh..."
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center"
                    >
                        Connetti
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                    
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Non hai un database? <a href="https://supabase.com" target="_blank" className="text-emerald-600 underline">Crealo Gratis</a>
                    </p>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};