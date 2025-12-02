
import { User } from '../types';
import { BRANDING } from '../constants';

const SESSION_KEY = 'saas_admin_session';

export const authService = {
  
  // Login tramite Token
  loginWithToken: (token: string): { success: boolean; message?: string; user?: User } => {
    // Normalizza il token
    if (token.trim() === BRANDING.masterToken) {
      const adminUser: User = {
        id: 'admin_master_id',
        username: BRANDING.adminName,
        role: 'admin'
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    return { success: false, message: "Token di accesso non valido." };
  },

  // Recupera Utente Corrente
  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
