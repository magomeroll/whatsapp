import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BotAccount, SupabaseConfig } from '../types';
import { SUPABASE_DEFAULTS } from '../constants';

let supabase: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export const supabaseService = {
  
  // Inizializza il client
  init: (url?: string, key?: string) => {
    try {
      let targetUrl = url;
      let targetKey = key;

      if (!targetUrl || !targetKey) {
          const saved = localStorage.getItem('supabase_config');
          if (saved) {
              const parsed = JSON.parse(saved);
              targetUrl = parsed.url;
              targetKey = parsed.key;
          }
      }

      // Fallback to Constants
      if (!targetUrl || !targetKey) {
          targetUrl = SUPABASE_DEFAULTS.url;
          targetKey = SUPABASE_DEFAULTS.key;
      }

      if (!targetUrl || !targetKey) return false;

      supabase = createClient(targetUrl, targetKey);
      currentConfig = { url: targetUrl, key: targetKey };
      
      return true;
    } catch (e) {
      console.error("Supabase init error", e);
      return false;
    }
  },

  getCurrentConfig: () => currentConfig || { url: SUPABASE_DEFAULTS.url, key: SUPABASE_DEFAULTS.key },

  resetToDefault: () => {
      localStorage.removeItem('supabase_config');
      return supabaseService.init(SUPABASE_DEFAULTS.url, SUPABASE_DEFAULTS.key);
  },

  isConfigured: () => !!supabase,

  loadNodes: async (userToken: string): Promise<BotAccount[]> => {
    if (!supabase) {
      supabaseService.init();
      if (!supabase) throw new Error("Database non inizializzato");
    }
    
    const { data, error } = await supabase
      .from('bot_nodes')
      .select('*')
      .eq('user_token', userToken);
      
    if (error) {
      console.error("Supabase load error:", error.message);
      throw new Error(error.message); // Sniper: lanciamo l'errore invece di gestire array vuoti qui
    }

    if (!data) return [];

    return data.map((row: any) => {
        const acc = row.data;
        return {
            ...acc,
            lastActive: acc.lastActive ? new Date(acc.lastActive) : undefined
        };
    });
  },

  saveNode: async (userToken: string, account: BotAccount) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('bot_nodes')
      .upsert({ 
          id: account.id,
          user_token: userToken,
          data: account
      });
      
    if (error) console.error("Save Error", error);
  },

  deleteNode: async (id: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('bot_nodes')
      .delete()
      .eq('id', id);

    if (error) console.error("Delete Error", error);
  }
};