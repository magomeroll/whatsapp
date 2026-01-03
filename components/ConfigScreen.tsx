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
  const [localConfig, setLocalConfig] = useState(account.config);
  const [isActive, setIsActive] = useState(account.isActive);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem(`server_url_${account.id}`) || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showRenderGuide, setShowRenderGuide] = useState(false);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleDeploy = async () => {
    onSave({
        ...account,
        isActive,
        config: localConfig
    });
    
    if (!serverUrl) {
        setIsDirty(false);
        setDeployStatus('success');
        setTimeout(() => setDeployStatus('idle'), 3000);
        return;
    }

    setIsDeploying(true);
    setErrorMessage('');
    
    try {
        const cleanUrl = serverUrl.replace(/\/$/, "");
        const endpoint = `${cleanUrl}/api/update-config`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: localConfig.systemInstruction,
                temperature: localConfig.temperature,
                isActive: isActive 
            })
        });

        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const data = await response.json();
        if (data.success) {
            setIsDirty(false);
            setDeployStatus('success');
        } else {
            throw new Error(data.message || "Errore sconosciuto");
        }
    } catch (error: any) {
        setDeployStatus('error');
        setErrorMessage(error.message || "Server non raggiungibile.");
    } finally {
        setIsDeploying(false);
    }
  };

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
    const pkg = {
      "name": "whatsapp-bot-v17-rocksolid",
      "version": "17.4.0",
      "description": "Bot WhatsApp V17.4 (Anti-Crash & Anti-Sleep)",
      "main": "server.js",
      "scripts": { "start": "node server.js" },
      "dependencies": {
        "@whiskeysockets/baileys": "^6.6.0",
        "qrcode": "^1.5.3", 
        "@google/genai": "^1.30.0",
        "pino": "^7.0.0"
      },
      "engines": { "node": ">=20.0.0 <21.0.0" }
    };
    downloadFile('package.json', JSON.stringify(pkg, null, 2));
  };

  const generateServerJs = () => {
    const content = `/**
 * BOT WA V17.4 - ROCK SOLID (Anti-Status 1)
 * Ottimizzato per Render.com Free Tier.
 * Fix: Global Exception Handlers + Potentiometer keepAlive.
 */
const http = require('http');
const https = require('https');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const { GoogleGenAI } = require("@google/genai");
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// --- ANTI-CRASH SYSTEM (Previene Status 1) ---
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err);
    // Non usciamo, lasciamo che Baileys provi a riconnettersi
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const PORT = process.env.PORT || 10000;
const AUTH_DIR = path.join(__dirname, 'auth_info_v17');
const CONFIG_FILE = path.join(__dirname, 'bot_config.json');

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
    } catch(e) {}
}

function saveConfig() { fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2)); }

let qrCodeDataUrl = '';
let statusMessage = 'Avvio V17.4...';
let isConnected = false;
let logs = [];
let ai = null;
let sock = null; 

function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    logs.unshift(\`[\${time}] \${msg}\`);
    if(logs.length > 20) logs.pop();
    console.log(msg);
}

// ANTI-SLEEP POTENZIATO
function keepAlive(url) {
    if (!url) return;
    const cleanUrl = url.startsWith('http') ? url : \`https://\${url}\`;
    setInterval(() => {
        addLog("Self-Ping: Keeping process alive...");
        https.get(cleanUrl, (res) => {
            // Success
        }).on('error', (e) => {
            // Ignore error, we just want to keep event loop busy
        });
    }, 10 * 60 * 1000); 
}

function initAI() {
    if(botConfig.apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey: botConfig.apiKey });
            addLog("AI: Pronta");
        } catch(e) { addLog("AI Errore: " + e.message); }
    }
}
initAI();

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/api/qr') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            qr: isConnected ? null : qrCodeDataUrl, 
            status: isConnected ? 'CONNECTED' : (qrCodeDataUrl ? 'SCAN_NEEDED' : 'INITIALIZING'),
            logs: logs.slice(0, 5),
            isActive: botConfig.isActive
        }));
        return;
    }

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
                addLog("Cloud Sync: OK");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch(e) { res.writeHead(400); res.end(); }
        });
        return;
    }

    if (req.url === '/api/logout' && req.method === 'POST') {
        try {
            addLog("DEEP RESET richiesto...");
            if(sock) { sock.end(undefined); sock = null; }
            if(fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            isConnected = false; qrCodeDataUrl = '';
            setTimeout(startBaileys, 3000);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch(e) { res.writeHead(500); res.end(); }
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(\`<h1>Bot V17.4 RockSolid</h1><p>Status: \${isConnected ? 'ONLINE' : 'SCAN QR'}</p>\`);
});

server.listen(PORT, () => {
    addLog(\`WEB SERVER OK PORT:\${PORT}\`);
    // Prova a recuperare l'URL esterno di Render
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if(renderUrl) keepAlive(renderUrl);
    startBaileys();
});

async function startBaileys() {
    if (sock) { try { sock.end(undefined); } catch(e) {} sock = null; }
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();
        
        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ["Chrome (Linux)", "Chrome", "122.0.0"],
            connectTimeoutMs: 60000,
            printQRInTerminal: false
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if(qr) {
                isConnected = false;
                qrcode.toDataURL(qr, (err, url) => { if(!err) qrCodeDataUrl = url; });
                statusMessage = "WAITING SCAN";
            }
            if(connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                addLog(\`Disco: \${statusCode}\`);
                
                if (statusCode === 440 || statusCode === 515 || lastDisconnect?.error?.message?.includes('conflict')) {
                     setTimeout(startBaileys, 15000); 
                } else if (statusCode !== DisconnectReason.loggedOut) {
                    setTimeout(startBaileys, 5000);
                } else {
                    addLog("Logout. Cleanup...");
                    if(fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    setTimeout(startBaileys, 5000);
                }
            } else if(connection === 'open') {
                isConnected = true; qrCodeDataUrl = ''; statusMessage = "CONNECTED";
                addLog(">>> BOT ONLINE <<<");
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if(type !== 'notify' || !botConfig.isActive) return;
            for(const msg of messages) {
                if(!msg.message || msg.key.fromMe) continue;
                const remoteJid = msg.key.remoteJid;
                const textBody = msg.message.conversation || msg.message.extendedTextMessage?.text;
                if(!textBody || !ai) continue;
                try {
                    await sock.readMessages([msg.key]);
                    await delay(1000);
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: textBody,
                        config: { systemInstruction: botConfig.systemInstruction, temperature: botConfig.temperature }
                    });
                    await sock.sendMessage(remoteJid, { text: response.text }, { quoted: msg });
                } catch (e) { addLog("AI Error: " + e.message); }
            }
        });
    } catch (e) {
        addLog("Loop Error: " + e.message);
        setTimeout(startBaileys, 10000);
    }
}
`;
    downloadFile('server.js', content);
  };

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-4 md:p-8" onClick={() => setIsDropdownOpen(false)}>
      <div className="max-w-6xl mx-auto">
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

             {isDropdownOpen && (
               <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
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
          <button onClick={() => setShowRenderGuide(true)} className="flex items-center px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
             <Cloud className="w-3.5 h-3.5 mr-2" /> Guida Render.com
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-2">
                        <Cloud className="w-4 h-4 text-slate-400" />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Istruzioni Bot (Prompt)</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                            <button onClick={() => handleIsActiveChange(true)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ON</button>
                            <button onClick={() => handleIsActiveChange(false)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${!isActive ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>OFF</button>
                        </div>
                        <button onClick={() => confirm("Ripristinare prompt?") && setLocalConfig(prev => ({...prev, systemInstruction: DEFAULT_INSTRUCTION}))} className="text-xs text-slate-500 hover:text-[#00a884] font-medium px-2 py-1 rounded">Reset</button>
                    </div>
                  </div>
                  <textarea
                    value={localConfig.systemInstruction}
                    onChange={(e) => handleConfigChange('systemInstruction', e.target.value)}
                    className="flex-1 w-full px-6 py-5 resize-none outline-none text-slate-700 font-mono text-sm leading-relaxed"
                  />
                </div>

                <div className="bg-gradient-to-br from-[#00a884] to-emerald-900 rounded-xl shadow-lg border border-emerald-700 p-6 text-white relative overflow-hidden">
                    <h3 className="text-lg font-bold mb-2 flex items-center text-emerald-100">
                        <Zap className="w-5 h-5 mr-2" /> Download Server V17.4 (Rock Solid)
                    </h3>
                    <p className="text-emerald-100/80 text-sm mb-6 max-w-xl">
                        Versione 17.4: Protezione contro gli errori 'Status 1' di Render e sistema di auto-sveglia potenziato per non perdere mai la connessione.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                        <button onClick={generateServerJs} className="flex-1 flex items-center justify-center p-3 rounded-lg border border-emerald-400 bg-emerald-900/40 hover:bg-emerald-800/60 transition-colors">
                            <FileCode className="w-4 h-4 mr-2 text-emerald-300" /> <span className="font-bold text-sm">server.js (V17.4)</span>
                        </button>
                        <button onClick={generatePackageJson} className="flex-1 flex items-center justify-center p-3 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors">
                            <FileJson className="w-4 h-4 mr-2 text-yellow-400" /> <span className="font-bold text-sm">package.json</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center text-slate-900">
                        <LinkIcon className="w-5 h-5 mr-2 text-emerald-600" /> Connetti Dashboard
                    </h3>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="https://my-bot.onrender.com"
                            value={serverUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="flex-1 px-4 py-2 border rounded-lg text-sm border-slate-300"
                        />
                        <button onClick={handleDeploy} disabled={isDeploying} className={`px-6 py-2 rounded-lg font-bold text-white flex items-center ${isDirty ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md' : 'bg-slate-400 cursor-not-allowed'}`}>
                            {isDeploying ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} AGGIORNA SERVER
                        </button>
                    </div>
                    {deployStatus === 'success' && <p className="text-emerald-600 text-xs mt-2 font-bold uppercase tracking-tight">✓ Sincronizzato con successo!</p>}
                    {deployStatus === 'error' && <p className="text-red-500 text-xs mt-2 font-bold uppercase tracking-tight">⚠️ Errore: {errorMessage}</p>}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-900 mb-4">Parametri IA</h3>
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
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};