
import React, { useState, useEffect } from 'react';
import { BotAccount, DEFAULT_INSTRUCTION } from '../types';
import { Save, RefreshCw, ChevronDown, Check, Smartphone, Cloud, UploadCloud, Loader2, Power, Key, ExternalLink, ShieldAlert, Eye, EyeOff, HelpCircle, X, Server, FileUp, Globe, MonitorOff, Download, FileJson, FileCode, Terminal, Link as LinkIcon, Zap, Trash2, Cpu, Settings, Box, Github } from 'lucide-react';

interface ConfigScreenProps {
  account: BotAccount;
  allAccounts: BotAccount[];
  onSwitchAccount: (id: string) => void;
  onSave: (updatedAccount: BotAccount) => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ account, allAccounts, onSwitchAccount, onSave }) => {
  // Local state to handle form edits before saving
  const [localConfig, setLocalConfig] = useState(account.config);
  const [isActive, setIsActive] = useState(account.isActive);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem(`server_url_${account.id}`) || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showRenderGuide, setShowRenderGuide] = useState(false);
  
  // Real deployment states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // When switching accounts, update local state
  useEffect(() => {
    setLocalConfig(account.config);
    setIsActive(account.isActive);
    setIsDirty(false);
    setIsDropdownOpen(false);
    setDeployStatus('idle');
    setServerUrl(localStorage.getItem(`server_url_${account.id}`) || '');
  }, [account.id]);

  const handleConfigChange = (field: keyof typeof localConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setDeployStatus('idle');
  };

  const handleIsActiveChange = (val: boolean) => {
      setIsActive(val);
      setIsDirty(true);
  };

  const handleUrlChange = (val: string) => {
      setServerUrl(val);
      localStorage.setItem(`server_url_${account.id}`, val);
  };

  // --- REAL DEPLOYMENT LOGIC (SYNC CONFIG & ACTIVE STATE) ---
  const handleDeploy = async () => {
    // Save locally first to update UI
    onSave({
        ...account,
        isActive,
        config: localConfig
    });
    
    // If no server URL is provided, we treat it as a "Local Save" for the simulator
    if (!serverUrl) {
        setIsDirty(false);
        setDeployStatus('success');
        setTimeout(() => setDeployStatus('idle'), 3000);
        return;
    }

    // REAL SERVER SYNC
    setIsDeploying(true);
    setErrorMessage('');
    
    try {
        // Clean URL
        const cleanUrl = serverUrl.replace(/\/$/, "");
        const endpoint = `${cleanUrl}/api/update-config`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemInstruction: localConfig.systemInstruction,
                temperature: localConfig.temperature,
                isActive: isActive // V14: Sync Active State
            })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            setIsDirty(false);
            setDeployStatus('success');
        } else {
            throw new Error(data.message || "Errore sconosciuto dal server");
        }

    } catch (error: any) {
        console.error("Deploy failed:", error);
        setDeployStatus('error');
        setErrorMessage(error.message || "Impossibile contattare il server. Verifica l'URL.");
    } finally {
        setIsDeploying(false);
    }
  };

  const handleReset = () => {
    if(confirm("Sei sicuro di voler ripristinare il prompt originale?")) {
      setLocalConfig({
        ...localConfig,
        systemInstruction: DEFAULT_INSTRUCTION
      });
      setIsDirty(true);
    }
  };

  // --- GENERATION LOGIC FOR REAL SERVER CODE (V16 ANTI-SLEEP) ---
  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generatePackageJson = () => {
    // V16: Same dependencies as V14/15
    const pkg = {
      "name": "whatsapp-bot-v16-pro",
      "version": "16.0.0",
      "description": "Bot WhatsApp V16 (Anti-Sleep & Auto-Reconnect)",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "dependencies": {
        "@whiskeysockets/baileys": "^6.6.0",
        "qrcode": "^1.5.3", 
        "@google/genai": "^1.30.0",
        "pino": "^7.0.0"
      },
      "overrides": {
        "eslint-config": "0.0.0",
        "@whiskeysockets/eslint-config": "0.0.0",
        "linkifyjs": "^4.0.0"
      },
      "engines": {
        "node": ">=20.0.0 <21.0.0"
      }
    };
    downloadFile('package.json', JSON.stringify(pkg, null, 2));
  };

  const generateServerJs = () => {
    const content = `/**
 * BOT WA V16.0 - ANTI-SLEEP & AUTO-RECONNECT
 * Fixes: Render Free Tier Sleeping, Connection drops, Keep-Alive
 */

const http = require('http');
const https = require('https'); // Required for self-ping
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const { GoogleGenAI } = require("@google/genai");
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const CONFIG_FILE = path.join(__dirname, 'bot_config.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_v16');

// --- CONFIG ---
let botConfig = {
    apiKey: process.env.API_KEY,
    systemInstruction: \`${localConfig.systemInstruction.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`,
    temperature: ${localConfig.temperature},
    isActive: true 
};

if (fs.existsSync(CONFIG_FILE)) {
    try {
        const saved = fs.readFileSync(CONFIG_FILE, 'utf8');
        botConfig = { ...botConfig, ...JSON.parse(saved) };
    } catch(e) { console.error("Config load error", e); }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2));
}

// Global State
let qrCodeDataUrl = '';
let statusMessage = 'Avvio V16 Anti-Sleep...';
let isConnected = false;
let logs = [];
let ai = null;
let sock = null; 

function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    logs.unshift(\`[\${time}] \${msg}\`);
    if(logs.length > 50) logs.pop();
    console.log(msg);
}

function initAI() {
    if(botConfig.apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey: botConfig.apiKey });
            addLog("AI: Pronta");
        } catch(e) { addLog("AI Errore: " + e.message); }
    } else {
        addLog("AI: Manca API Key (Verifica Env Var)");
    }
}
initAI();

// 1. HTTP SERVER
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // API: GET QR Status
    if (req.url === '/api/qr') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            qr: isConnected ? null : qrCodeDataUrl, 
            status: isConnected ? 'CONNECTED' : (qrCodeDataUrl ? 'SCAN_NEEDED' : 'INITIALIZING'),
            instanceId: "${account.instanceId}",
            logs: logs.slice(0, 10),
            isActive: botConfig.isActive
        }));
        return;
    }

    // API: Update Config 
    if (req.url === '/api/update-config' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if(data.systemInstruction) botConfig.systemInstruction = data.systemInstruction;
                if(data.temperature !== undefined) botConfig.temperature = data.temperature;
                if(data.isActive !== undefined) botConfig.isActive = data.isActive; 
                
                saveConfig();
                initAI();
                addLog(\`Config aggiornata. Bot Attivo: \${botConfig.isActive}\`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch(e) { res.writeHead(400); res.end(); }
        });
        return;
    }

    // API: Force Reset / Logout
    if (req.url === '/api/logout' && req.method === 'POST') {
        addLog(">>> HARD RESET RICHIESTO DA DASHBOARD <<<");
        try {
            if(sock) { sock.end(undefined); sock = null; }
            if(fs.existsSync(AUTH_DIR)) {
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                addLog("File sessione eliminati fisicamente.");
            }
            isConnected = false;
            qrCodeDataUrl = '';
            statusMessage = "RESET COMPLETO";
            setTimeout(startBaileys, 3000);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch(e) {
            addLog("Errore Reset: " + e.message);
            res.writeHead(500); res.end();
        }
        return;
    }

    // Status Page
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(\`<html><body style="font-family:sans-serif;background:#1e1e1e;color:#fff;text-align:center;padding:50px;">
        <div style="background:#2d2d2d;padding:30px;border-radius:15px;max-width:600px;margin:auto;border-top:5px solid #00a884;box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h1 style="color:#00a884;">Bot V16 Anti-Sleep</h1>
            <p>Status: <strong>\${isConnected ? '✅ CONNESSO' : '⚠️ ' + statusMessage}</strong></p>
            <p>Mode: <strong>\${botConfig.isActive ? '🟢 ATTIVO' : '🔴 IN PAUSA'}</strong></p>
            <div style="background:#000;padding:15px;border-radius:8px;font-family:monospace;text-align:left;font-size:12px;color:#00a884;max-height:300px;overflow-y:auto;">
               \${logs.join('<br>')}
            </div>
            <p style="font-size:10px;color:#666;margin-top:20px;">Render External URL: \${process.env.RENDER_EXTERNAL_URL || 'Non rilevato'}</p>
        </div>
    </body></html>\`);
});

server.listen(PORT, () => {
    addLog(\`WEB SERVER OK PORT:\${PORT}\`);
    startBaileys();
});

// --- ANTI-SLEEP MECHANISM (V16 FEATURE) ---
// Render free tier sleeps after 15 mins of inactivity. 
// We ping ourselves every 14 mins (840,000 ms) using the public URL.
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL; 
if (RENDER_EXTERNAL_URL) {
    addLog(\`Anti-Sleep ATTIVO su: \${RENDER_EXTERNAL_URL}\`);
    setInterval(() => {
        addLog("⏰ Anti-Sleep Ping...");
        https.get(\`\${RENDER_EXTERNAL_URL}/api/qr\`, (res) => {
            // We don't care about response, just making the request keeps it alive
        }).on('error', (e) => {
            console.error("Anti-Sleep Ping Failed:", e.message);
        });
    }, 840000); // 14 Minutes
} else {
    addLog("⚠️ Anti-Sleep DISATTIVO (Manca RENDER_EXTERNAL_URL). Il bot potrebbe andare in pausa.");
}

// 2. WHATSAPP LOGIC
async function startBaileys() {
    addLog("Avvio Motore WhatsApp (V16)...");
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();
        
        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'error' }), 
            browser: ["Ubuntu", "Chrome", "20.0.04"], 
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 25000, // Più frequente per V16
            emitOwnEvents: false,
            retryRequestDelayMs: 5000,  // Più lento a riprovare
            syncFullHistory: false, 
            printQRInTerminal: false
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if(qr) {
                isConnected = false;
                statusMessage = "SCANSIONA QR";
                qrcode.toDataURL(qr, (err, url) => {
                    if(!err) qrCodeDataUrl = url;
                });
                addLog("QR Code Rigenerato");
            }

            if(connection === 'close') {
                isConnected = false;
                qrCodeDataUrl = '';
                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                
                if (statusCode === DisconnectReason.loggedOut) {
                    addLog("Logout ricevuto. Pulisco sessione...");
                     if(fs.existsSync(AUTH_DIR)) {
                        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    }
                }

                addLog(\`Disconnesso: \${error?.message || 'Reconnecting...'}\`);
                // Force delay before reconnect to avoid loop spam
                setTimeout(startBaileys, 5000);

            } else if(connection === 'open') {
                isConnected = true;
                qrCodeDataUrl = '';
                statusMessage = "CONNESSO";
                addLog(">>> V16 CONNESSO & STABILE <<<");
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if(type !== 'notify') return;
            if(!botConfig.isActive) return;

            for(const msg of messages) {
                if(!msg.message || msg.key.fromMe) continue;
                
                const remoteJid = msg.key.remoteJid;
                const textBody = msg.message.conversation || msg.message.extendedTextMessage?.text;
                
                if(!textBody) continue;
                addLog(\`Msg: \${textBody.substring(0, 15)}...\`);

                try {
                    if(ai) {
                        await sock.readMessages([msg.key]);
                        await delay(1000); 
                        
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: textBody,
                            config: { 
                                systemInstruction: botConfig.systemInstruction,
                                temperature: botConfig.temperature 
                            }
                        });
                        
                        const replyText = response.text;
                        await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });
                        addLog("Risposta inviata");
                    }
                } catch (e) {
                    addLog("Errore AI: " + e.message);
                }
            }
        });

    } catch (e) {
        addLog("CRASH STARTUP: " + e.message);
        setTimeout(startBaileys, 5000);
    }
}
`;
    downloadFile('server.js', content);
  };
  // ---------------------------------------------

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-4 md:p-8" onClick={() => setIsDropdownOpen(false)}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Account Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="relative z-20">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Istanza Server</label>
             <button 
                onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                className="flex items-center space-x-3 bg-white border border-slate-200 hover:border-slate-300 shadow-sm rounded-xl p-2 pr-4 transition-all min-w-[320px]"
             >
                <div className={`w-10 h-10 rounded-lg ${account.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                    {account.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                    <h1 className="text-lg font-bold text-slate-900 leading-tight truncate">{account.name}</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-mono truncate">{account.phoneNumber}</span>
                        {account.status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Account Dropdown */}
             {isDropdownOpen && (
               <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                  <div className="p-2 space-y-1">
                    {allAccounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => onSwitchAccount(acc.id)}
                        className={`w-full flex items-center p-2 rounded-lg transition-colors ${acc.id === account.id ? 'bg-emerald-50 text-[#00a884]' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                         <div className={`w-8 h-8 rounded-md ${acc.avatarColor} flex items-center justify-center text-white font-bold text-sm mr-3`}>
                            {acc.name.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{acc.name}</div>
                            <div className="text-xs opacity-70 flex justify-between">
                                <span>{acc.phoneNumber}</span>
                                {acc.status === 'connected' && <span className="text-emerald-600 font-bold text-[10px]">ONLINE</span>}
                            </div>
                         </div>
                         {acc.id === account.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>
          
          <div className="flex items-center space-x-3">
             <button
                onClick={() => setShowRenderGuide(true)}
                className="flex items-center px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
             >
                <Cloud className="w-3.5 h-3.5 mr-2" />
                Guida Render.com
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Editor */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Script Editor Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-2">
                        <Cloud className="w-4 h-4 text-slate-400" />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Istruzioni Bot (Prompt)</h3>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                            <button
                                onClick={() => handleIsActiveChange(true)}
                                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                ON
                            </button>
                            <button
                                onClick={() => handleIsActiveChange(false)}
                                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${!isActive ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                OFF
                            </button>
                        </div>
                        
                        <button 
                        onClick={handleReset}
                        className="text-xs text-slate-500 hover:text-[#00a884] flex items-center transition-colors font-medium px-2 py-1 rounded hover:bg-slate-100"
                        >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Reset
                        </button>
                    </div>
                  </div>
                  
                  <textarea
                    value={localConfig.systemInstruction}
                    onChange={(e) => handleConfigChange('systemInstruction', e.target.value)}
                    className="flex-1 w-full px-6 py-5 resize-none outline-none text-slate-700 font-mono text-sm leading-relaxed"
                    placeholder="Scrivi qui le istruzioni per il tuo bot. Esempio: Sei un assistente per una pizzeria. Accetta prenotazioni solo se..."
                  />

                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                    <span>Supporta Markdown e Emoji</span>
                    <span>{localConfig.systemInstruction.length} chars</span>
                  </div>
                </div>

                {/* Export Real Bot Section */}
                <div className="bg-gradient-to-br from-[#00a884] to-emerald-900 rounded-xl shadow-lg border border-emerald-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Github className="w-32 h-32" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 flex items-center text-emerald-100">
                        <Download className="w-5 h-5 mr-2" />
                        Download Server V16 (Anti-Sleep)
                    </h3>
                    <p className="text-emerald-100/80 text-sm mb-6 max-w-xl">
                        Risolve il problema della disconnessione dopo 15 minuti su Render Free. Il server si auto-pinga per rimanere attivo.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                        <button 
                            onClick={generateServerJs}
                            className={`flex-1 flex items-center justify-center p-3 rounded-lg border border-emerald-400 bg-emerald-900/40 hover:bg-emerald-800/60 transition-colors`}
                        >
                            <FileCode className="w-4 h-4 mr-2 text-emerald-300" />
                            <span className="font-bold text-sm">server.js (V16)</span>
                        </button>
                        
                        <button 
                             onClick={generatePackageJson}
                             className="flex-1 flex items-center justify-center p-3 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors"
                        >
                            <FileJson className="w-4 h-4 mr-2 text-yellow-400" />
                            <span className="font-bold text-sm">package.json</span>
                        </button>
                    </div>
                </div>

                {/* 2. Connection Link Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 flex items-center text-slate-900">
                        <LinkIcon className="w-5 h-5 mr-2 text-emerald-600" />
                        Connetti Dashboard
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Inserisci qui l'URL fornito da Render (es. <code>https://my-bot.onrender.com</code>). 
                    </p>
                    
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="https://..."
                            value={serverUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className={`flex-1 px-4 py-2 border rounded-lg text-sm ${!serverUrl && isDirty ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`}
                        />
                        <a 
                            href={serverUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => !serverUrl && e.preventDefault()}
                            className={`px-6 py-2 rounded-lg font-bold text-white flex items-center ${serverUrl ? 'bg-slate-700 hover:bg-slate-800' : 'bg-slate-300 cursor-not-allowed'}`}
                        >
                            TEST URL <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Column: Settings & Key */}
            <div className="space-y-6">
                
                {/* AI Params */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-900 mb-4">Parametri Comportamento</h3>
                   <div className="mb-2">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-slate-700">Creatività</label>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{localConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={localConfig.temperature}
                        onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00a884]"
                      />
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-slate-100">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <div className="text-sm font-bold text-slate-800">Stato Operativo</div>
                                <div className="text-xs text-slate-500">Metti in pausa le risposte</div>
                            </div>
                            <div 
                                onClick={() => handleIsActiveChange(!isActive)}
                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </label>
                   </div>
                </div>

                <div className="pt-4 sticky bottom-4">
                  {/* Status Messages */}
                  {deployStatus === 'error' && (
                      <div className="mb-3 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100 flex items-start">
                          <ShieldAlert className="w-4 h-4 mr-2 shrink-0" />
                          {errorMessage}
                      </div>
                  )}
                  {deployStatus === 'success' && (
                      <div className="mb-3 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs border border-emerald-100 flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Configurazione inviata al server con successo!
                      </div>
                  )}

                  <button
                    onClick={handleDeploy}
                    disabled={(!isDirty && deployStatus !== 'error') || isDeploying}
                    className={`w-full flex items-center justify-center py-4 px-4 rounded-xl font-bold text-white transition-all shadow-lg transform active:scale-95 border-b-4 ${
                      isDirty || deployStatus === 'error'
                        ? 'bg-[#00a884] hover:bg-[#008f6f] border-[#007a5e] shadow-emerald-200' 
                        : 'bg-slate-300 border-slate-400 cursor-not-allowed shadow-none text-slate-500'
                    }`}
                  >
                    {isDeploying ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sincronizzazione...
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-5 h-5 mr-2" />
                            {isDirty ? 'Aggiorna Server' : 'Sincronizzato'}
                        </>
                    )}
                  </button>
                  {!serverUrl && (
                      <p className="text-center text-[10px] text-slate-400 mt-2">
                          *URL Server non impostato. Salvataggio solo locale.
                      </p>
                  )}
                </div>
            </div>
        </div>

        {/* Modal Guida RENDER.COM */}
        {showRenderGuide && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center space-x-3">
                     <div className="bg-white/20 p-2 rounded-lg">
                        <Cloud className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold">Guida Render.com (Gratis)</h2>
                        <p className="text-slate-300 text-sm">Deploy Rapido e Sicuro</p>
                     </div>
                  </div>
                  <button onClick={() => setShowRenderGuide(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                     <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-4 text-sm text-slate-600">
                 
                 <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">1. Prepara i file</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Scarica <code>server.js</code> (V16) e <code>package.json</code> da qui.</li>
                        <li>Carica questi 2 file nel tuo Repository GitHub.</li>
                    </ul>
                 </div>

                 <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">2. Deploy su Render</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Vai su <a href="https://render.com" target="_blank" className="text-blue-600 underline">Render.com</a> Dashboard.</li>
                        <li>Seleziona il progetto.</li>
                        <li>Clicca <strong>Manual Deploy &rarr; Clear Build Cache & Deploy</strong>.</li>
                        <li>(Questo è necessario per pulire i file corrotti delle versioni precedenti).</li>
                    </ul>
                 </div>
                 
                 <p className="font-bold text-emerald-600">
                     Il server dovrebbe tornare operativo in 2-3 minuti.
                 </p>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                 <button 
                    onClick={() => setShowRenderGuide(false)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                 >
                    Ho Capito
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
