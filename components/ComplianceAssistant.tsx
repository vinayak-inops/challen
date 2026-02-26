
import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Bot, Sparkles, BarChart2, FileText, DollarSign, ClipboardList, User, Building2, PieChart, Briefcase } from 'lucide-react';
import { startChatSession, sendChatMessage } from '../services/geminiService';
import { ChatMessage, Contractor } from '../types';
import { Chat } from "@google/genai";
import RichTextRenderer from './RichTextRenderer';

interface ComplianceAssistantProps {
  contractors: Contractor[];
}

const ComplianceAssistant: React.FC<ComplianceAssistantProps> = ({ contractors }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your CLMS Assistant. Ask me to check compliance, generate reports, or visualize data.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (contractors.length > 0 && !chatSessionRef.current) {
      chatSessionRef.current = startChatSession(contractors);
    }
  }, [contractors]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim() || !chatSessionRef.current) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setQuery('');
    setIsLoading(true);

    const response = await sendChatMessage(chatSessionRef.current, textToSend);
    setMessages(prev => [...prev, response]);
    setIsLoading(false);
  };

  const suggestions = [
    { icon: User, label: "Employee Profile", prompt: "Fetch employee profile" },
    { icon: ClipboardList, label: "Punch Logs", prompt: "Show punch details" },
    { icon: DollarSign, label: "Payslip", prompt: "Generate Payslip" },
    { icon: Briefcase, label: "Work Orders", prompt: "Analyze active work orders" },
    { icon: PieChart, label: "Visualize Compliance", prompt: "Generate a pie chart showing the compliance status distribution of all contractors." },
    { icon: Building2, label: "List Contractors", prompt: "List all contractors with their status." },
    { icon: FileText, label: "Monthly Summary", prompt: "Generate a Monthly Compliance Summary." },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2">
         <h1 className="text-2xl font-normal text-slate-800">Compliance Assistant</h1>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-4 shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-blue-50 border-blue-100 text-slate-800' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {msg.role === 'model' ? <><Bot size={14}/> CLMS AI</> : "You"}
                </div>
                {msg.role === 'user' ? <div className="text-sm">{msg.text}</div> : <RichTextRenderer content={msg.text} />}
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Search size={10} /> Sources</p>
                    <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, i) => (
                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-xs block">
                                {source.title || source.uri}
                            </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
                    <div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div></div>
                    <span className="text-xs text-slate-400">Thinking...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSendMessage(s.prompt)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm whitespace-nowrap">
                  <s.icon size={12} /> {s.label}
                </button>
              ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Message CLMS Assistant..."
                    className="w-full pl-4 pr-12 py-3 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-sm"
                />
                <button onClick={() => handleSendMessage()} disabled={isLoading || !query.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30">
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAssistant;
