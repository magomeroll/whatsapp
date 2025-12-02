
import { BrandConfig } from './types';

// --- CONFIGURAZIONE BRANDING (PERSONALIZZA QUI) ---
export const BRANDING: BrandConfig = {
    appName: "WhatsApp Manager Pro",
    footerText: "© 2025 AleaSistemi Solutions. All rights reserved.",
    adminName: "Amministratore AleaSistemi",
    
    // Questo è il token di default se non impostato su Vercel
    masterToken: "ALEASISTEMI1409", 
    
    primaryColor: "emerald" // Opzioni: emerald, blue, purple, orange
};

// --- CONFIGURAZIONE DATABASE DEFAULT ---
// Nota: In produzione è meglio usare le Environment Variables di Vercel (VITE_SUPABASE_URL)
export const SUPABASE_DEFAULTS = {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || "https://ugtxetihyghgerrazanq.supabase.co",
    key: (import.meta as any).env?.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndHhldGloeWdoZ2VycmF6YW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTk3NDEsImV4cCI6MjA4MDIzNTc0MX0.8Ylw8zoQubEgSveV-Gx-szvZXBpMRNGZ61GzQsZFUg0"
};
