import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, Activity, ArrowRight, Shield } from 'lucide-react';

interface AiAssistantViewProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Welcome to **StatEdge AI**! I am your personal sports analytics assistant and tactical strategist.\n\nAsk me anything about match predictions, Expected Goals (xG), pressing intensity (PPDA), head-to-head comparisons, or tactical breakdowns!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presetPrompts = [
    "Predict Real Madrid vs Barcelona outcome & xG",
    "Compare Haaland vs Mbappé per-90 metrics",
    "Tactical breakdown of Arsenal's high pressing scheme",
    "Which team has the highest xG efficiency in Europe?",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || "I'm sorry, I couldn't generate a response at this moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "⚠️ Failed to connect to StatEdge AI service. Please verify your GEMINI_API_KEY environment configuration.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-4 pb-20 flex flex-col h-[calc(100vh-8rem)]">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>StatEdge AI Tactical Assistant</span>
          </h1>
          <p className="text-xs text-slate-400">Powered by Gemini 3.6 Flash for real-time sports intelligence</p>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Gemini AI Connected</span>
        </span>
      </div>

      {/* Preset Prompts Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presetPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 group"
          >
            <Sparkles className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 overflow-y-auto space-y-4 shadow-2xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <span className="text-[10px] text-slate-500 block text-right font-mono">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-cyan-400 font-semibold bg-slate-950/80 p-3 rounded-2xl border border-slate-800 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>StatEdge Gemini Engine analyzing match vectors & xG...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="relative">
        <input
          type="text"
          placeholder="Ask StatEdge AI (e.g. 'Predict Arsenal vs Chelsea' or 'Analyze Haaland's xG')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="w-full pl-4 pr-12 py-3.5 text-xs sm:text-sm rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-xl transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="absolute right-2 top-2 p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
