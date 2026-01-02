import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ConfigScreen } from './components/ConfigScreen';
import { ChatSimulator } from './components/ChatSimulator';
import { AccountDashboard } from './components/AccountDashboard';
import { AuthScreen } from './components/AuthScreen';
import { DatabaseConfigScreen } from './components/DatabaseConfigScreen';
import { BotAccount, DEFAULT_INSTRUCTION, User } from './types';
import { initChatSession } from './services/geminiService';
import { authService } from './services/authService';
import { supabaseService } from './services/supabaseService';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { BRANDING } from './constants';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Database State
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDbSettings, setShowDbSettings] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState<'accounts' | 'config' | 'chat'>('accounts');
  const [accounts, setAccounts] = useState<BotAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  // 1. Check Login on Mount & Init DB
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      supabaseService.init();
      loadCloudNodes();
    }
    setIsAuthChecking(false);
  }, []);

  // 2. Load Accounts from Cloud
  const loadCloudNodes = async () => {
    setIsDbLoading(true);
    setDbError(null);
    try {
        const nodes = await supabaseService.loadNodes(BRANDING.masterToken);
        if (nodes) {
            setAccounts(nodes);
        }
    } catch (e: any) {
        console.error("Cloud Load Error", e);
        // Sniper: Invece di setAccounts([]), manteniamo gli ultimi caricati 
        // e informiamo l'utente dell'errore di sincronizzazione.
        setDbError("Errore sincronizzazione Cloud. I dati potrebbero non essere aggiornati.");
    } finally {
        setIsDbLoading(false);
    }
  };

  // 3. Gemini Init
  useEffect(() => {
    if (selectedAccount && selectedAccount.isActive && selectedAccount.status === 'connected') {
      initChatSession(selectedAccount.config);
    }
  }, [selectedAccount?.id, selectedAccount?.config, selectedAccount?.isActive]);

  // --- Handlers ---

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    supabaseService.init();
    loadCloudNodes();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAccounts([]);
    setSelectedAccountId(null);
  };

  const handleDbReconfigured = () => {
      setShowDbSettings(false);
      loadCloudNodes();
  };

  const generateInstanceId = () => {
    return Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  };

  const handleCreateAccount = async (name: string, phoneNumber: string) => {
    if (!currentUser) return;
    
    const newAccount: BotAccount = {
      id: Date.now().toString(),
      instanceId: generateInstanceId(),
      userId: currentUser.id, 
      name,
      phoneNumber,
      isActive: true,
      status: 'disconnected',
      serverStatus: 'offline',
      messagesCount: 0,
      avatarColor: ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-orange-600', 'bg-pink-600'][accounts.length % 5],
      config: {
        systemInstruction: DEFAULT_INSTRUCTION,
        temperature: 0.7
      }
    };

    setAccounts(prev => [...prev, newAccount]);
    await supabaseService.saveNode(BRANDING.masterToken, newAccount);
  };

  const handleUpdateAccount = async (updatedAccount: BotAccount) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    await supabaseService.saveNode(BRANDING.masterToken, updatedAccount);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Eliminare definitivamente dal Cloud?")) return;
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    if (selectedAccountId === id) setSelectedAccountId(null);
    await supabaseService.deleteNode(id);
  };

  const handleTabChange = (tab: 'accounts' | 'config' | 'chat') => {
    if ((tab === 'config' || tab === 'chat') && !selectedAccount) {
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
        setActiveTab(tab);
        return;
      }
      alert("Crea prima un account WhatsApp nella Dashboard.");
      setActiveTab('accounts');
      return;
    }
    setActiveTab(tab);
  };

  if (isAuthChecking) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-bold tracking-tight">Inizializzazione Sistema...</div>;

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        accountCount={accounts.length}
        user={currentUser}
        onLogout={handleLogout}
        onOpenDbConfig={() => setShowDbSettings(true)}
      />
      
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {dbError && (
          <div className="bg-amber-500 text-white px-4 py-2 flex justify-between items-center text-xs font-bold z-50">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {dbError}
            </div>
            <button 
              onClick={loadCloudNodes} 
              className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Riprova Sync
            </button>
          </div>
        )}

        {activeTab === 'accounts' && (
          <AccountDashboard 
            accounts={accounts}
            onCreate={handleCreateAccount}
            onSelect={(id) => { setSelectedAccountId(id); setActiveTab('config'); }}
            onDelete={handleDeleteAccount}
            onUpdate={handleUpdateAccount}
          />
        )}

        {activeTab === 'config' && selectedAccount && (
          <ConfigScreen 
            account={selectedAccount}
            allAccounts={accounts}
            onSwitchAccount={setSelectedAccountId}
            onSave={handleUpdateAccount} 
          />
        )}

        {activeTab === 'chat' && selectedAccount && (
          <ChatSimulator account={selectedAccount} />
        )}

        {/* Database Config Modal */}
        {showDbSettings && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="relative w-full max-w-2xl">
                    <button 
                        onClick={() => setShowDbSettings(false)}
                        className="absolute -top-4 -right-4 bg-white rounded-full p-2 hover:bg-slate-100 z-50 shadow-lg transition-transform hover:scale-110"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DatabaseConfigScreen onConfigured={handleDbReconfigured} />
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;