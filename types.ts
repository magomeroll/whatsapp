

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface BotConfig {
  systemInstruction: string;
  temperature: number;
}

export type ConnectionStatus = 'disconnected' | 'scanning' | 'connected';
export type ServerStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface User {
  id: string;
  username: string;
  role: 'admin';
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface BrandConfig {
  appName: string;
  footerText: string;
  adminName: string;
  masterToken: string; // Default fallback
  primaryColor: string; // Tailwind class identifier (e.g. 'emerald')
}

export interface BotAccount {
  id: string;
  instanceId: string; // PlanifyX style ID (e.g. 692C275AE02BB)
  userId: string; // FONDAMENTALE: Collega il bot all'utente specifico
  phoneNumber: string; 
  name: string; 
  isActive: boolean; 
  status: ConnectionStatus;
  config: BotConfig;
  avatarColor: string;
  
  // Cloud/Server specific fields
  lastActive?: Date;
  serverStatus: ServerStatus;
  messagesCount: number;
}

export const DEFAULT_INSTRUCTION = `Sei un assistente virtuale professionale.
Il tuo compito è rispondere ai clienti fornendo informazioni chiare e precise.
Sii cortese, professionale e usa emoji occasionalmente.
Se non conosci la risposta, chiedi di attendere un operatore umano.`;

export const MAX_ACCOUNTS = 10;