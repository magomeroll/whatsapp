
import React from 'react';
import { Settings, MessageSquare, LayoutDashboard, Database, LogOut, Shield, Cloud, Cog } from 'lucide-react';
import { User as UserType } from '../types';
import { BRANDING } from '../constants';

interface SidebarProps {
  activeTab: 'accounts' | 'config' | 'chat';
  setActiveTab: (tab: 'accounts' | 'config' | 'chat') => void;
  accountCount: number;
  user: UserType | null;
  onLogout: () => void;
  onOpenDbConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, accountCount, user, onLogout, onOpenDbConfig }) => {
  return (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-full shrink-0 shadow-xl relative z-20">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800 bg-slate-950">
        <Database className="w-7 h-7 text-[#00a884]" />
        <span className="hidden md:block ml-3 font-bold text-lg tracking-tight truncate">{BRANDING.appName}</span>
      </div>

      {/* User Profile Snippet */}
      {user && (
        <div className="p-4 border-b border-slate-800 hidden md:flex items-center space-x-3 bg-slate-800/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg">
                <Shield className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
                <div className="font-bold text-sm truncate">{user.username}</div>
                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center">
                    <Cloud className="w-3 h-3 mr-1" /> Cloud Sync
                </div>
            </div>
        </div>
      )}

      <nav className="flex-1 py-6 space-y-1">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`w-full flex items-center px-4 py-3 transition-all ${
            activeTab === 'accounts' 
              ? 'bg-[#00a884] text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="hidden md:block ml-3 font-medium">Dashboard</span>
          <span className="hidden md:flex ml-auto bg-slate-800 text-xs py-0.5 px-2 rounded-full border border-slate-700">
            {accountCount}
          </span>
        </button>

        <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:block">
          Area Personale
        </div>

        <button
          onClick={() => setActiveTab('config')}
          className={`w-full flex items-center px-4 py-3 transition-all ${
            activeTab === 'config' 
              ? 'bg-slate-800 text-[#00a884] border-l-4 border-[#00a884]' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="hidden md:block ml-3 font-medium">Configurazione</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center px-4 py-3 transition-all ${
            activeTab === 'chat' 
              ? 'bg-slate-800 text-[#00a884] border-l-4 border-[#00a884]' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden md:block ml-3 font-medium">Simulatore</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={onOpenDbConfig}
            className="w-full flex items-center justify-center md:justify-start px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mb-1"
            title="Impostazioni Database"
        >
            <Cog className="w-5 h-5" />
            <span className="hidden md:block ml-3 font-medium text-sm">Cloud Config</span>
        </button>

        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center md:justify-start px-2 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:block ml-3 font-medium text-sm">Esci</span>
        </button>
        
        <div className="bg-slate-800 rounded-lg p-3 mt-4 hidden md:block">
          <p className="text-xs text-slate-400 mb-1">System Status</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-300">v19.0 SaaS Core</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
