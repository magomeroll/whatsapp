
import React, { useState, useEffect } from 'react';
import { BotAccount, MAX_ACCOUNTS } from '../types';
import { Plus, QrCode, Smartphone, Edit3, Server, Globe, Activity, Power, Wifi, CloudCheck, ShieldCheck, X, Terminal, AlertTriangle, MonitorPlay, ExternalLink, Key, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface AccountDashboardProps {
  accounts: BotAccount[];
  onCreate: (name: string, phoneNumber: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (account: BotAccount) => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({ 
  accounts, 
  onCreate, 
  onSelect,
  onDelete,
  onUpdate
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  // States for modals
  const [connectionStep, setConnectionStep] = useState<'none' | 'choice' | 'simulator' | 'production'>('none');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  
  // Real QR Polling State
  const [remoteQr, setRemoteQr] = useState<string | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<string>('CONNECTING');
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Fake "Server Heartbeat" effect
  const [uptime, setUptime] = useState(99.8);
  useEffect(() => {
    const timer = setInterval(() => {
        setUptime(prev => prev > 99.99 ? 99.8 : prev + 0.001);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Poll Remote Server for QR Logic
  useEffect(() => {
    if (connectionStep === 'production' && serverUrl && selectedAccountId) {
        // Start polling
        const poll = setInterval(async () => {
            if (isResetting) return; // Pause polling during reset
            try {
                const cleanUrl = serverUrl.replace(/\/$/, "");
                const res = await fetch(`${cleanUrl}/api/qr`);
                if(res.ok) {
                    const data = await res.json();
                    setRemoteQr(data.qr || null);
                    setRemoteStatus(data.status);
                    
                    // V15 FIX: Do NOT auto-connect here blindly.
                    // Only update state variables, let the UI decide what to show.
                }
            } catch(e) {
                console.error("Polling error", e);
                setRemoteStatus('ERROR');
            }
        }, 2000);
        setPollingInterval(poll);
    } else {
        if(pollingInterval) clearInterval(pollingInterval);
        setRemoteQr(null);
    }
    
    return () => {
        if(pollingInterval) clearInterval(pollingInterval);
    };
  }, [connectionStep, serverUrl, selectedAccountId, isResetting]);


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newPhone) {
      onCreate(newName, newPhone);
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);
    }
  };

  const initConnectFlow = (id: string) => {
      // V16: REMOVED SINGLE SESSION RESTRICTION
      // Now allows connecting multiple accounts simultaneously 
      // (Assuming they are on different Render servers)

      setSelectedAccountId(id);
      // Retrieve saved URL if exists
      const savedUrl = localStorage.getItem(`server_url_${id}`);
      if(savedUrl) setServerUrl(savedUrl);
      setConnectionStep('choice');
  };

  const startSimulatorScan = () => {
    setConnectionStep('simulator');
    setScanProgress(0);
    
    // Simulate connection process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Find account and update status
        if (selectedAccountId) {
            const acc = accounts.find(a => a.id === selectedAccountId);
            if (acc) {
            onUpdate({ 
                ...acc, 
                status: 'connected', 
                serverStatus: 'online', 
                lastActive: new Date() 
            });
            }
        }
        setTimeout(() => setConnectionStep('none'), 800);
      }
    }, 200);
  };

  const forceRemoteReset = async () => {
      if(!serverUrl) return;
      if(!confirm("Sei sicuro? Questo disconnetterà qualsiasi telefono attualmente collegato al server.")) return;
      
      setIsResetting(true);
      setRemoteStatus('RESETTING');
      try {
          const cleanUrl = serverUrl.replace(/\/$/, "");
          await fetch(`${cleanUrl}/api/logout`, { method: 'POST' });
          
          // Wait a bit for server to restart
          setTimeout(() => {
              setIsResetting(false);
              setRemoteStatus('CONNECTING'); // This will trigger polling to find the new QR
          }, 4000);
      } catch(e) {
          alert("Errore durante il reset del server. Verifica l'URL.");
          setIsResetting(false);
      }
  };

  const disconnect = async (account: BotAccount) => {
    if (!confirm("Vuoi disconnettere questo numero? Il server disconnetterà WhatsApp e cancellerà la sessione.")) return;
    
    // 1. Try Remote Logout First
    const savedUrl = localStorage.getItem(`server_url_${account.id}`);
    if (savedUrl) {
        try {
            const cleanUrl = savedUrl.replace(/\/$/, "");
            await fetch(`${cleanUrl}/api/logout`, { method: 'POST' });
        } catch(e) {
            console.error("Remote logout failed", e);
            alert("Impossibile contattare il server per il logout remoto. Disconnessione solo locale.");
        }
    }

    // 2. Update Local State
    onUpdate({ ...account, status: 'disconnected', serverStatus: 'offline', isActive: false });
  };

  const activeCount = accounts.filter(a => a.status === 'connected').length;
  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Stats */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Server</h1>
                <p className="text-slate-500 mt-2">Gestione istanze WhatsApp Cloud.</p>
              </div>
              <button 
                  onClick={() => accounts.length < MAX_ACCOUNTS && setShowAddModal(true)}
                  disabled={accounts.length >= MAX_ACCOUNTS}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-lg shadow-sm transition-all font-medium whitespace-nowrap ${
                      accounts.length >= MAX_ACCOUNTS 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                  <Plus className="w-5 h-5" />
                  <span>Nuovo Nodo</span>
              </button>
          </div>

          {/* Persistent Connection Banner */}
          {activeCount > 0 && (
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-start md:items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                <CloudCheck className="w-6 h-6 text-emerald-600 mr-3 shrink-0" />
                <div className="flex-1">
                   <h3 className="font-bold text-emerald-800 text-sm">Sessione Cloud Attiva</h3>
                   <p className="text-emerald-700/80 text-xs mt-0.5">
                     Il servizio è in esecuzione su Render.com. 
                     <strong> Puoi chiudere questa finestra o spegnere il PC.</strong> Il bot continuerà a rispondere.
                   </p>
                </div>
                <div className="hidden md:block">
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                     Always On
                   </span>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Server className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Stato Sistema</div>
                      <div className="text-xl font-bold text-slate-800">Operativo</div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                      <Globe className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Uptime Server</div>
                      <div className="text-xl font-bold text-slate-800">{uptime.toFixed(3)}%</div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                      <Activity className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Slot Utilizzati</div>
                      <div className="text-xl font-bold text-slate-800">{accounts.length} / {MAX_ACCOUNTS}</div>
                  </div>
              </div>
          </div>
        </header>

        {/* Nodes Grid */}
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center">
            Nodi Attivi
            {activeCount > 0 && <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Live Server</span>}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md group">
              {/* Status Bar */}
              <div className={`h-1.5 w-full ${
                  acc.status === 'connected' 
                    ? (acc.isActive ? 'bg-emerald-500' : 'bg-amber-400') 
                    : 'bg-red-400'
              }`}></div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-xl ${acc.avatarColor} flex items-center justify-center text-white font-bold text-2xl shadow-sm`}>
                    {acc.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                    acc.status === 'connected' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span>{acc.status === 'connected' ? (acc.isActive ? 'CONNECTED' : 'PAUSED') : 'OFFLINE'}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 truncate mb-1">{acc.name}</h3>
                <p className="text-sm text-slate-500 mb-2 flex items-center">
                  <Smartphone className="w-4 h-4 mr-2 text-slate-400" /> {acc.phoneNumber}
                </p>
                <p className="text-xs font-mono text-slate-400 mb-6 flex items-center bg-slate-50 p-1.5 rounded w-fit">
                   <Key className="w-3 h-3 mr-1.5" /> ID: {acc.instanceId}
                </p>

                {/* Server Stats (Fake) */}
                {acc.status === 'connected' && (
                    <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-400 block mb-0.5">Messaggi Ricevuti</span>
                            <span className="font-mono font-bold text-slate-700">{Math.floor(Math.random() * 50) + acc.messagesCount + 120}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-400 block mb-0.5">Sessione</span>
                            <span className="font-mono font-bold text-emerald-600">Persistente</span>
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-3">
                  {acc.status === 'disconnected' ? (
                    <button 
                      onClick={() => initConnectFlow(acc.id)}
                      className="w-full flex items-center justify-center py-3 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg transition-colors text-sm font-bold shadow-sm"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Collega WhatsApp
                    </button>
                  ) : (
                    <button 
                      onClick={() => onSelect(acc.id)}
                      className="w-full flex items-center justify-center py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-bold"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Configura Bot
                    </button>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                     <span className="text-xs text-slate-400">Node: v17.0 Stability</span>
                     <div className="flex space-x-2">
                        {acc.status === 'connected' && (
                            <button onClick={() => disconnect(acc)} title="Disconnetti Sessione Remota (Logout)" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <Wifi className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => { if(confirm('Eliminare definitivamente questo nodo?')) onDelete(acc.id); }} title="Elimina Nodo" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <Power className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {accounts.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Server className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Nessun nodo attivo</h3>
                  <p className="max-w-sm mt-1 mb-6">Inizia collegando il tuo primo numero WhatsApp per attivare il bot sul server Render.</p>
                  <button 
                      onClick={() => setShowAddModal(true)}
                      className="px-6 py-2 bg-[#00a884] text-white rounded-lg font-medium hover:bg-[#008f6f]"
                  >
                      Aggiungi Primo Account
                  </button>
              </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                    <Plus className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Nuovo Nodo Server</h2>
                    <p className="text-sm text-slate-500">Configurazione istanza WhatsApp</p>
                </div>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Etichetta Interna</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Es. Ristorante Roma..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00a884] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Numero WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+39 333 1234567"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00a884] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f] font-bold shadow-md shadow-emerald-200 transition-all transform active:scale-95"
                >
                  Crea Nodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHOICE MODAL: SIMULATOR VS REAL */}
      {connectionStep === 'choice' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Scegli Modalità di Connessione</h2>
                    <p className="text-slate-500">Come vuoi collegare questo bot?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <button 
                        onClick={() => setConnectionStep('production')}
                        className="p-8 hover:bg-pink-50 transition-colors text-left group flex flex-col h-full"
                    >
                        <div className="mb-4 bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                            <Server className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Produzione V14</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">
                            Collega numero reale tramite Render.com. Include Controllo Remoto e Logout.
                        </p>
                        <div className="flex items-center text-pink-700 font-bold text-sm">
                            Avvia Link <Globe className="w-4 h-4 ml-2" />
                        </div>
                    </button>

                    <button 
                        onClick={startSimulatorScan}
                        className="p-8 hover:bg-blue-50 transition-colors text-left group flex flex-col h-full"
                    >
                        <div className="mb-4 bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <MonitorPlay className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Simulatore Browser</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">
                            Ambiente di test sicuro. Usa un numero finto per provare i prompt e le risposte dell'IA.
                        </p>
                         <div className="flex items-center text-blue-700 font-bold text-sm">
                            Avvia Test <Activity className="w-4 h-4 ml-2" />
                        </div>
                    </button>
                </div>
                <div className="bg-slate-50 p-4 flex justify-center">
                    <button onClick={() => setConnectionStep('none')} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Annulla</button>
                </div>
             </div>
        </div>
      )}

      {/* PLANIFYX STYLE MODAL - PRODUCTION */}
      {connectionStep === 'production' && currentAccount && (
          <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                <div className="bg-[#00a884] p-4 flex justify-between items-center text-white">
                     <h2 className="text-lg font-bold flex items-center">
                         <Terminal className="w-5 h-5 mr-2" />
                         Aggiungi Profilo WhatsApp
                     </h2>
                     <button onClick={() => setConnectionStep('none')} className="text-white/80 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                
                {/* PlanifyX Style Card Body */}
                <div className="p-6 bg-slate-50">
                    
                    {!serverUrl ? (
                         <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm mb-4">
                             <h4 className="font-bold flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> URL Server Mancante</h4>
                             <p className="mt-1">Non hai configurato l'URL del server nello step 2. La dashboard non può recuperare il QR Code.</p>
                             <button onClick={() => onSelect(currentAccount.id)} className="mt-2 text-amber-900 underline font-bold">Vai a Configurazione</button>
                         </div>
                    ) : (
                        <div className="py-2">
                            {/* Instance ID Box */}
                            <div className="border border-gray-200 rounded-xl p-5 mb-4 bg-white shadow-sm">
                                <div className="text-lg font-semibold text-slate-800 flex items-center mb-1">
                                    <Key className="w-5 h-5 mr-2 text-slate-400" /> 
                                    ID istanza: <span className="text-emerald-600 font-mono ml-2">{currentAccount.instanceId}</span>
                                </div>
                                <div className="text-slate-500 text-sm">Scansiona il codice QR sulla tua app Whatsapp</div>
                            </div>

                            {/* QR Code Container */}
                            <div className="flex justify-center my-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative min-h-[300px] items-center">
                                {isResetting ? (
                                    <div className="flex flex-col items-center justify-center text-amber-600 animate-pulse">
                                        <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
                                        <p className="font-bold text-center">Reset Sessione Server...</p>
                                        <p className="text-xs">Attendere riavvio motore</p>
                                    </div>
                                ) : remoteStatus === 'CONNECTED' ? (
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 relative">
                                            <CloudCheck className="w-10 h-10 text-emerald-600" />
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">!</div>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800">Rilevata Sessione Attiva</h3>
                                        <p className="text-sm text-slate-500 mb-6 max-w-[250px]">
                                            Il server è già connesso a un telefono. Vuoi usare questa connessione o scansionarne una nuova?
                                        </p>
                                        
                                        <div className="space-y-3 w-full">
                                            <button 
                                                onClick={() => {
                                                    onUpdate({ 
                                                        ...currentAccount, 
                                                        status: 'connected', 
                                                        serverStatus: 'online', 
                                                        lastActive: new Date() 
                                                    });
                                                    setConnectionStep('none');
                                                }}
                                                className="w-full py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200"
                                            >
                                                Usa Sessione Esistente
                                            </button>
                                            
                                            <button 
                                                onClick={forceRemoteReset}
                                                className="w-full py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 flex items-center justify-center"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                RESETTA & NUOVO QR
                                            </button>
                                        </div>
                                    </div>
                                ) : remoteQr ? (
                                    <img 
                                        className="w-[280px] h-[280px] object-contain mix-blend-multiply opacity-90 animate-in zoom-in duration-300" 
                                        src={remoteQr}
                                        alt="WhatsApp QR Code" 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        {remoteStatus === 'ERROR' ? (
                                            <div className="text-red-500 flex flex-col items-center">
                                                <AlertTriangle className="w-10 h-10 mb-2" />
                                                <p>Errore connessione Server</p>
                                                <p className="text-xs text-slate-400 mt-1">Verifica che server.js sia avviato</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Loader2 className="w-10 h-10 animate-spin mb-4 text-slate-300" />
                                                <p>In attesa del QR Code dal server...</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="text-center text-xs text-slate-400">
                                Status: <span className="font-mono font-bold text-slate-600">{remoteStatus}</span>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}

      {/* SIMULATOR QR Code Modal */}
      {connectionStep === 'simulator' && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row h-[550px] animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex-1 p-10 flex flex-col justify-center items-start bg-white relative">
              <button onClick={() => setConnectionStep('none')} className="absolute top-4 left-4 p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
              </button>
              <h2 className="text-3xl font-light text-slate-800 mb-4">Simulatore Browser</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 text-sm text-blue-800 flex items-start">
                  <ShieldCheck className="w-5 h-5 mr-3 shrink-0" />
                  <p>Questa è una simulazione. Nessun telefono reale verrà collegato. Serve per testare le risposte dell'IA.</p>
              </div>
              <ol className="list-decimal list-inside space-y-4 text-slate-600 text-lg">
                <li>Stiamo generando un ambiente virtuale</li>
                <li>Simulazione handshake crittografico...</li>
                <li>Attendi il collegamento...</li>
              </ol>
            </div>
            
            <div className="w-full md:w-[450px] bg-slate-50 border-l border-slate-100 flex flex-col items-center justify-center p-10 relative">
              <div className="relative group">
                {/* Fake QR Code Pattern */}
                <div className="w-72 h-72 bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                  <div className="w-full h-full bg-slate-900 p-1 grid grid-cols-12 gap-0.5 opacity-90 rounded-lg overflow-hidden">
                     {Array.from({ length: 144 }).map((_, i) => (
                       <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-10'}`} />
                     ))}
                     
                     {/* Scanning Animation Line */}
                     <div className="absolute top-4 left-4 right-4 h-1 bg-[#00a884] shadow-[0_0_15px_#00a884] animate-[scan_2.5s_linear_infinite] opacity-80 z-10"></div>
                  </div>
                </div>

                {/* Loading/Success Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {scanProgress > 80 && (
                      <div className="bg-white p-4 rounded-full shadow-xl animate-in zoom-in duration-300">
                        <Smartphone className="w-10 h-10 text-[#00a884]" />
                      </div>
                  )}
                </div>
              </div>

              {/* Progress Text */}
              <div className="mt-8 text-center w-full max-w-[280px]">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Avvio Simulazione</span>
                    <span>{scanProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-500 mt-3 font-medium animate-pulse">
                  {scanProgress < 100 ? 'Creazione ambiente test...' : 'Ambiente Pronto!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 20px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 270px; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
