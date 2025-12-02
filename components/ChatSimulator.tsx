
import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, BotAccount } from '../types';
import { sendMessageToBot } from '../services/geminiService';
import { Send, MoreVertical, Phone, Video, Smile, Paperclip, CheckCheck, Lock } from 'lucide-react';

interface ChatSimulatorProps {
  account: BotAccount;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ account }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear chat when switching accounts
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [account.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.USER,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Logic: Only reply if the Bot is Active AND Connected
    if (!account.isActive) {
      // Bot is off - do nothing (simulating user ignoring msg)
      return;
    }

    if (account.status !== 'connected') {
        // Optional: System message warning
        return;
    }

    setIsTyping(true);

    try {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); 
      
      // Pass the message to Gemini (Config is already loaded in service via App.tsx effect)
      const responseText = await sendMessageToBot(userMsg.text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.BOT,
        timestamp: new Date(),
        status: 'read'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Errore di connessione al server.",
        sender: Sender.BOT,
        timestamp: new Date(),
        status: 'read'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#e5ddd5] relative">
      <div className="absolute inset-0 whatsapp-bg opacity-40 z-0 pointer-events-none"></div>

      {/* Header */}
      <div className="bg-[#008069] h-16 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 text-white">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${account.avatarColor} flex items-center justify-center overflow-hidden border border-white/20 text-white font-bold`}>
             {account.name.charAt(0)}
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-base leading-tight">{account.name}</h2>
            <p className="text-xs text-white/80 mt-0.5">
              {isTyping ? 'Sta scrivendo...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-5">
          <Video className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
          <Phone className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
          <MoreVertical className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 z-10 space-y-2">
         {/* Encryption Notice */}
         <div className="flex justify-center mb-6 mt-2">
           <div className="bg-[#ffeecd] text-[#54656f] text-[10px] md:text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center max-w-[90%] text-center">
             <Lock className="w-2.5 h-2.5 mr-1.5 shrink-0" />
             I messaggi e le chiamate sono crittografati end-to-end.
           </div>
         </div>
         
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-sm ${
                msg.sender === Sender.USER 
                  ? 'bg-[#d9fdd3] rounded-tr-none' 
                  : 'bg-white rounded-tl-none'
              }`}
            >
              <div className="mr-6 md:mr-10 text-gray-800 whitespace-pre-wrap leading-relaxed py-1">
                {msg.text}
              </div>
              <div className="absolute bottom-1 right-2 flex items-center space-x-1">
                <span className="text-[10px] text-gray-500">{formatTime(msg.timestamp)}</span>
                {msg.sender === Sender.USER && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] px-4 py-2 shrink-0 z-10">
        {!account.isActive && (
           <div className="mb-2 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-md border border-red-200 flex justify-center">
             BOT DISATTIVATO - L'IA non risponderà ai messaggi
           </div>
        )}
        <div className="flex items-center space-x-3">
          <Smile className="w-6 h-6 text-gray-500 cursor-pointer" />
          <Paperclip className="w-6 h-6 text-gray-500 cursor-pointer" />
          
          <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 shadow-sm">
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
              placeholder="Scrivi un messaggio"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-3 rounded-full shadow-sm transition-all ${
              input.trim() 
                ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' 
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
