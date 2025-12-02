
import { BrandConfig } from './types';

// --- CONFIGURAZIONE BRANDING (PERSONALIZZA QUI) ---
export const BRANDING: BrandConfig = {
    appName: "WhatsApp Manager Pro",
    footerText: "© 2025 Gennaro Merolla Solutions. All rights reserved.",
    adminName: "Admin",
    
    // Questo è il token di default se non impostato su Vercel
    masterToken: "ALEASISTEMI1409", 
    
    primaryColor: "orange" // Opzioni: emerald, blue, purple, orange
};

// --- CONFIGURAZIONE DATABASE DEFAULT ---
// Nota: In produzione è meglio usare le Environment Variables di Vercel (VITE_SUPABASE_URL)
export const SUPABASE_DEFAULTS = {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || "https://lwrckjfdzkiajtnriqxf.supabase.co",
    key: (import.meta as any).env?.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmNramZkemtpYWp0bnJpcXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY5MDIsImV4cCI6MjA4MDI2MjkwMn0.2qeoZ_rkomp1kXvBBQKmD62JRu45zbaNZYTOA49M-IM"
};
