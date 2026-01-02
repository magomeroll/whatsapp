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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'config' | 'chat'>('accounts');
  const [accounts, setAccounts] = useState<BotAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      supabaseService.init();
      loadCloudNodes();
    }
    setIsAuthChecking(false);
  }, []);

  const loadCloudNodes = async () => {
    setIsDbLoading(true);
    setDbError(null);
    try {
        const nodes = await supabaseService.loadNodes(BRANDING.masterToken);
        if (nodes && nodes.length > 0) {
            setAccounts(nodes);
        }
    } catch (e: any) {
        console.error("Cloud Sync Error", e);
        setDbError("Sincronizzazione Cloud fallita. I dati visualizzati potrebbero non essere aggiornati.");
    } finally {
        setIsDbLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedAccount.isActive && selectedAccount.status === 'connected') {
      initChatSession(selectedAccount.config);
    }
  }, [selectedAccount?.id, selectedAccount?.config, selectedAccount?.isActive]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    supabaseService.init();
    loadCloudNodes();
  };

  const handleUpdateAccount = async (updatedAccount: BotAccount) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    await supabaseService.saveNode(BRANDING.masterToken, updatedAccount);
  };

  const handleCreateAccount = async (name: string, phoneNumber: string) => {
    const newAccount: BotAccount = {
      id: Date.now().toString(),
      instanceId: Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
      userId: currentUser?.id || 'admin', 
      name,
      phoneNumber,
      isActive: true,
      status: 'disconnected',
      serverStatus: 'offline',
      messagesCount: 0,
      avatarColor: 'bg-emerald-600',
      config: { systemInstruction: DEFAULT_INSTRUCTION, temperature: 0.7 }
    };
    setAccounts(prev => [...prev, newAccount]);
    await supabaseService.saveNode(BRANDING.masterToken, newAccount);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Eliminare definitivamente?")) return;
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    await supabaseService.deleteNode(id);
  };

  if (isAuthChecking) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-bold">Inizializzazione...</div>;
  if (!currentUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => setActiveTab(t)} 
        accountCount={accounts.length}
        user={currentUser}
        onLogout={() => { authService.logout(); setCurrentUser(null); }}
        onOpenDbConfig={() => setShowDbSettings(true)}
      />
      
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {dbError && (
          <div className="bg-amber-500 text-white px-4 py-2 flex justify-between items-center text-xs font-bold z-50">
            <div className="flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {dbError}</div>
            <button onClick={loadCloudNodes} className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">Riprova</button>
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
          <ConfigScreen account={selectedAccount} allAccounts={accounts} onSwitchAccount={setSelectedAccountId} onSave={handleUpdateAccount} />
        )}

        {activeTab === 'chat' && selectedAccount && <ChatSimulator account={selectedAccount} />}

        {showDbSettings && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-2xl">
                    <button onClick={() => setShowDbSettings(false)} className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg z-50 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
                    <DatabaseConfigScreen onConfigured={() => { setShowDbSettings(false); loadCloudNodes(); }} />
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;