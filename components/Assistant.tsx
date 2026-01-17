
import React, { useState, useRef, useEffect } from 'react';
import { getWaterAdvice, AIResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; uri: string }[];
}

interface AssistantProps {
  onBack?: () => void;
}

const Assistant: React.FC<AssistantProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your PureFlow Assistant, now connected to Google Cloud for real-time information. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const result: AIResponse = await getWaterAdvice(userMsg);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: result.text,
      sources: result.sources 
    }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Cloud Assistant</h2>
      </div>

      <div className="flex flex-col flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="bg-blue-600 dark:bg-blue-800 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <i className="fas fa-cloud"></i>
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">PureFlow Cloud AI</h2>
            <p className="text-blue-100 dark:text-blue-300 text-[10px]">Real-time Google Grounding active</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-none border border-gray-100 dark:border-slate-700'
              }`}>
                {m.content}
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Grounding Sources</p>
                    <div className="flex flex-wrap gap-1">
                      {m.sources.slice(0, 3).map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full hover:underline line-clamp-1"
                        >
                          <i className="fas fa-link mr-1"></i> {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-2 flex gap-1">
                <div className="h-1.5 w-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about water safety..."
            className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 active:scale-95 shadow-md"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
