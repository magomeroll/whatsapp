import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BotAccount, SupabaseConfig } from '../types';
import { SUPABASE_DEFAULTS } from '../constants';

let supabase: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export const supabaseService = {
  
  init: (url?: string, key?: string) => {
    try {
      let targetUrl = url || localStorage.getItem('supabase_url') || SUPABASE_DEFAULTS.url;
      let targetKey = key || localStorage.getItem('supabase_key') || SUPABASE_DEFAULTS.key;

      if (!targetUrl || !targetKey) return false;

      supabase = createClient(targetUrl, targetKey);
      currentConfig = { url: targetUrl, key: targetKey };
      
      localStorage.setItem('supabase_url', targetUrl);
      localStorage.setItem('supabase_key', targetKey);
      
      return true;
    } catch (e) {
      console.error("Supabase init error", e);
      return false;
    }
  },

  getCurrentConfig: () => currentConfig || { url: SUPABASE_DEFAULTS.url, key: SUPABASE_DEFAULTS.key },

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
      throw new Error(error.message);
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
    try {
      await supabase.from('bot_nodes').upsert({ 
          id: account.id,
          user_token: userToken,
          data: account
      });
    } catch (e) {}
  },

  deleteNode: async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('bot_nodes').delete().eq('id', id);
    } catch (e) {}
  }
};