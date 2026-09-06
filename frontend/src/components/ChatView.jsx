import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Square } from 'lucide-react';
import { API_URL, saveHistorySession } from '../api';
import MessageBubble, { TypingIndicator } from './MessageBubble';

const PLACEHOLDER_HINTS = [
  'What is the leave encashment policy?',
  'Explain the work-from-home guidelines.',
  'How does the appraisal process work?',
  'What are the travel reimbursement rules?',
];

function nowTime(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AgentPipeline({ activeAgent }) {
  const agents = ['Starting', 'Researcher', 'Communicator', 'Reviewer', 'Done'];
  let currentIndex = agents.indexOf(activeAgent);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="z-20 sticky top-0 flex items-center justify-center gap-2 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-dark-950/80 backdrop-blur-xl px-4 overflow-x-auto select-none shadow-md w-full shrink-0 transition-colors">
      {agents.map((agent, i) => {
        const isPast = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={agent} className="flex items-center gap-2 whitespace-nowrap">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isActive ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse' :
              isPast ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
              'bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-white/5'
            }`}>
              {agent}
            </div>
            {i !== agents.length - 1 && <div className={`w-4 h-[1px] ${isPast ? 'bg-emerald-500/30' : 'bg-slate-200 dark:bg-white/5'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatView({ 
    user, sessionId, setSessionId, messages, setMessages, saveChat, setSaveChat, onRefreshHistory,
    textSize, userBubbleColor, aiBubbleColor, onViewPdf
}) {
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const abortControllerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }

  useEffect(() => {
    if (user && !sessionId) {
       startNewChat();
    }
  }, [user, sessionId]);

  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading, autoScroll]);

  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
    if (isAtBottom !== autoScroll) {
      setAutoScroll(isAtBottom);
    }
  };

  function startNewChat() {
    const freshSession = Date.now().toString();
    setSessionId(freshSession);
    setSaveChat(false);
    setMessages([]);
  }

  async function handleSend(e, overrideQuery = null, overrideMessages = null) {
    if (e) e.preventDefault();
    const q = (overrideQuery !== null ? overrideQuery : query).trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q, time: nowTime() };
    const tempAssistantId = Date.now() + 1;
    const currentHist = overrideMessages !== null ? overrideMessages : messages;
    
    setAutoScroll(true);

    setMessages([
      ...currentHist,
      userMsg,
      { id: tempAssistantId, role: 'assistant', content: '', time: nowTime(), active_agent: 'Initializinging...' }
    ]);
    
    if (overrideQuery === null) setQuery('');
    setError('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...msg, active_agent: 'Waiting (3s)... Click Stop to edit' } : msg
      ));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (controller.signal.aborted) {
        setMessages(currentHist); 
        if (overrideQuery === null) setQuery(q); 
        setLoading(false);
        return; 
      }

      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...msg, active_agent: 'Initializing...' } : msg
      ));

      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, employee_id: user.username, session_id: sessionId, save_chat: saveChat }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  setError(data.error);
                  done = true;
                  break;
                }
                setMessages(prev => prev.map(msg => {
                  if (msg.id === tempAssistantId) {
                    return {
                      ...msg,
                      content: data.response || msg.content,
                      active_agent: data.agent,
                      hallucination_check: data.hallucination_check,
                      accuracy_score: data.accuracy_score
                    };
                  }
                  return msg;
                }));
              } catch (e) {
                console.error("JSON parse error for SSE chunk", e);
              }
            }
          }
        }
      }

      if (onRefreshHistory) onRefreshHistory();
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(msg => msg.id === tempAssistantId ? { ...msg, active_agent: 'Stopped' } : msg));
        return;
      }
      setError(`Agent pipeline error: ${err.message}`);
    } finally {
      setLoading(false);
      setMessages(prev => prev.map(msg => msg.id === tempAssistantId ? { ...msg, active_agent: 'Done' } : msg));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleToggleSave(checked) {
      setSaveChat(checked);
      if (checked && sessionId && messages.length > 1) {
          try {
              await saveHistorySession(sessionId);
              if (onRefreshHistory) onRefreshHistory();
          } catch (e) {
              console.error("Failed to retroactively save session:", e);
          }
      }
  }

  async function handleEditSubmit(newQuery, msgId) {
      const idx = messages.findIndex(m => m.id === msgId);
      if (idx === -1) return;
      const truncated = messages.slice(0, idx);
      handleSend(null, newQuery, truncated);
  }

  const activeAgentNav = messages.length > 0 ? messages[messages.length - 1].active_agent || 'Done' : 'Done';
  
  const InputForm = (
    <div className="w-full relative z-20">
      <form onSubmit={handleSend} className="flex items-end gap-3 w-full">
        <div className="flex-1 relative group">
          <textarea 
            ref={inputRef} 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                if (query.trim() && !loading) {
                  handleSend(e);
                }
              }
            }}
            placeholder="Ask Lumina..." 
            disabled={loading} 
            rows={query.split('\n').length > 4 ? 4 : Math.max(1, query.split('\n').length)}
            style={{ minHeight: '56px', resize: 'none' }}
            className="w-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 pr-14 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 transition-all duration-300 custom-scrollbar shadow-lg" 
          />
          <div className="absolute right-3 bottom-3 flex items-center justify-center w-8 h-8">
            {loading && (
              <svg className="animate-spin absolute inset-0 w-8 h-8 text-rose-500/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <button 
              type="button"
              onClick={loading ? stopGeneration : undefined}
              disabled={!loading}
              className={`relative p-1.5 rounded-lg transition-all flex items-center justify-center z-10 ${
                loading 
                  ? 'text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-slate-100 dark:bg-dark-900 shadow-sm cursor-pointer' 
                  : 'text-slate-400 dark:text-zinc-600 bg-transparent cursor-default'
              }`}
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !query.trim()} 
          className={`w-[56px] h-[56px] flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 shrink-0 ${
            loading || !query.trim() 
              ? 'bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-white/5 shadow-none cursor-not-allowed' 
              : 'bg-brand-500 hover:bg-brand-400 active:bg-brand-600 text-white shadow-brand-500/25 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:scale-[1.02] active:scale-95'
          }`}
        >
          <Send className="w-5 h-5 ml-0.5" /> 
        </button>
      </form>
      
      <div className="text-center mt-3">
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
          <strong className="text-slate-500 dark:text-zinc-400">Lumina AI</strong> can make mistakes. Verify important information.
        </p>
      </div>
      
      {messages.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-4 mt-4 px-2">
           <label className="flex items-center gap-3 cursor-pointer group">
             <span className={`text-[11px] font-semibold tracking-wide transition-colors ${saveChat ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-zinc-500'}`}>
               Save Chat
             </span>
             <div className="relative">
               <input type="checkbox" className="sr-only peer" checked={saveChat} onChange={e => handleToggleSave(e.target.checked)} />
               <div className={`block w-9 h-5 rounded-full transition-all ${saveChat ? 'bg-brand-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-200 dark:bg-dark-700 border border-slate-300 dark:border-white/5 group-hover:border-slate-400 dark:group-hover:border-white/10'}`}></div>
               <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${saveChat ? 'translate-x-4' : 'translate-x-0'}`}></div>
             </div>
           </label>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full relative bg-transparent">
      
      {messages.length > 0 && <AgentPipeline activeAgent={activeAgentNav} />}

      {/* Main Chat Area (Scrollable) */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll} 
        className="flex-1 overflow-y-auto overscroll-y-none px-4 sm:px-8 py-6 space-y-6 custom-scrollbar transition-colors"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in relative z-10">
             <div className="max-w-3xl w-full flex flex-col items-center mt-[-10vh]">
                <img src="/logo.jpg" alt="Lumina" className="w-16 h-16 mb-6 rounded-full drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-float" />
                <h1 className="text-4xl sm:text-5xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-500 dark:from-brand-300 dark:via-purple-300 dark:to-brand-400 mb-3 text-center tracking-tight" style={{ lineHeight: '1.2' }}>
                   Hello, {user?.name?.split(' ')[0] || user?.username}
                </h1>
                <h2 className="text-xl sm:text-2xl font-medium text-slate-500 dark:text-slate-400 text-center mb-10">
                   How can I help you today?
                </h2>
                
                <div className="w-full max-w-2xl relative transition-colors">
                   {InputForm}
                </div>
             </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((msg, i) => (
               <MessageBubble 
                  key={`${msg.id}-${i}`} 
                  message={msg} 
                  onEditSubmit={handleEditSubmit}
                  textSize={textSize}
                  userBubbleColor={userBubbleColor}
                  aiBubbleColor={aiBubbleColor}
                  onViewPdf={onViewPdf}
               />
            ))}
            {loading && <TypingIndicator />}
            {error && <div className="glass-card border-red-500/30 bg-red-900/10 px-4 py-3 animate-fade-in"><p className="text-red-400 text-sm">{error}</p></div>}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="px-4 sm:px-8 pt-4 pb-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-dark-950/80 backdrop-blur-xl shrink-0 z-10 w-full relative transition-colors">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto">
            {InputForm}
          </div>
        </div>
      )}
      
    </div>
  );
}
