import { useState, useEffect } from 'react';
import { Download, Eye, EyeOff, ShieldAlert, Lock, Briefcase, ArrowRight, FileText, Clock, Check, X } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Sidebar       from './components/Sidebar';
import ChatView      from './components/ChatView';
import AdminDashboard from './components/AdminDashboard';
import Register      from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import SetupProfile from './components/SetupProfile';
import { healthCheck, login, googleLogin } from './api';

function LoginScreen({ onLogin, onForgotPassword, onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const user = await login(username, password);
      const isPrivileged = user.role === 'master' || user.role === 'admin' || user.role === 'subadmin';
      if (user.is_first_login) {
        onLogin(user, 'setup');
      } else {
        onLogin(user, isPrivileged ? 'admin' : 'chat');
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8 w-full relative min-h-screen py-12 overflow-hidden bg-slate-50 dark:bg-dark-950">
      {/* Background Mesh (New Premium Theme) */}
      <div className="absolute inset-0 bg-mesh z-0"></div>
      
      {/* Dynamic Animated Blobs */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '-3s' }}></div>

      {/* Login Box */}
      <div className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl p-10 w-full max-w-sm animate-fade-in-up z-10 relative">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Lumina AI" className="w-16 h-16 mx-auto mb-4 rounded-full drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-white tracking-tight">Lumina AI</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Enterprise Agentic Workspace</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[13px] text-slate-600 dark:text-zinc-400 font-medium mb-1.5 ml-1">Employee Number</label>
            <input type="text" name="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} disabled={loading} required placeholder="e.g. EMP001" className="input-field" autoFocus />
          </div>
          <div className="relative">
            <label className="block text-[13px] text-slate-600 dark:text-zinc-400 font-medium mb-1.5 ml-1">Password</label>
            <input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading} required placeholder="••••••••" className="input-field pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[36px] text-slate-400 dark:text-zinc-500 hover:text-brand-500 dark:hover:text-white transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end items-center mb-6">
            <button type="button" onClick={onForgotPassword} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">Forgot Password?</button>
          </div>
          
          {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 p-2.5 rounded-lg mb-2">{error}</div>}
          
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2">
            {loading ? <div className="typing-indicator"><div className="typing-dot bg-white"></div><div className="typing-dot bg-white"></div><div className="typing-dot bg-white"></div></div> : 'Sign In To Workspace'}
          </button>

          {/* Google SSO Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/5"></div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold tracking-widest uppercase">Or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/5"></div>
          </div>

           {/* Google SSO Button */}
          <div className="flex justify-center transition-transform hover:scale-[1.02]" id="google-sso-btn">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setLoading(true);
                setError('');
                try {
                  const user = await googleLogin(credentialResponse.credential);
                  const isPrivileged = user.role === 'master' || user.role === 'admin' || user.role === 'subadmin';
                  if (user.is_first_login) {
                    onLogin(user, 'setup');
                  } else {
                    onLogin(user, isPrivileged ? 'admin' : 'chat');
                  }
                } catch (e) {
                  setError(e.response?.data?.detail || 'Google SSO failed.');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => setError('Google Sign-In failed. Please try again.')}
              theme="filled_black"
              shape="rectangular"
              text="continue_with"
              width="280"
              logo_alignment="center"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView]         = useState('chat');   // 'chat' | 'admin'
  const [user, setUser]         = useState(null);     // { username, role, name, emp_num }
  const [backendOk, setBackend] = useState(null);
  const [theme, setTheme]       = useState('light');

  // Personalization State
  const [textSize, setTextSize] = useState('md');
  const [userBubbleColor, setUserBubbleColor] = useState('blue');
  const [aiBubbleColor, setAiBubbleColor] = useState('white');
  const [fontStyle, setFontStyle] = useState('Inter');

  const [hasAgreedTerms, setHasAgreedTerms] = useState(true);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [viewPdfUrl, setViewPdfUrl] = useState(null);

  // Load user-specific preferences on login
  useEffect(() => {
    if (user?.username) {
      setTextSize(localStorage.getItem(`enterprise_text_size_${user.username}`) || 'md');
      setUserBubbleColor(localStorage.getItem(`enterprise_user_color_${user.username}`) || 'blue');
      setAiBubbleColor(localStorage.getItem(`enterprise_ai_color_${user.username}`) || 'white');
      setFontStyle(localStorage.getItem(`enterprise_font_style_${user.username}`) || 'Inter');
      
      // Check NDA agreement
      setHasAgreedTerms(localStorage.getItem(`enterprise_terms_agreed_${user.username}`) === 'true');
    }
  }, [user?.username]);

  // Save user-specific preferences
  useEffect(() => { if (user?.username) localStorage.setItem(`enterprise_text_size_${user.username}`, textSize); }, [textSize, user?.username]);
  useEffect(() => { if (user?.username) localStorage.setItem(`enterprise_user_color_${user.username}`, userBubbleColor); }, [userBubbleColor, user?.username]);
  useEffect(() => { if (user?.username) localStorage.setItem(`enterprise_ai_color_${user.username}`, aiBubbleColor); }, [aiBubbleColor, user?.username]);
  useEffect(() => { if (user?.username) localStorage.setItem(`enterprise_font_style_${user.username}`, fontStyle); }, [fontStyle, user?.username]);



  // Lifted Chat State
  const [historyData, setHistoryData] = useState([]);
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [sessionId, setSessionId]     = useState('');
  const [messages, setMessages]       = useState([]);
  const [saveChat, setSaveChat]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Handle URL-based routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash === 'admin' || hash === 'chat') {
        setView(hash);
      }
    };
    
    // Check initial hash
    if (!window.location.hash) {
      window.location.hash = '#/chat';
    } else {
      handleHash();
    }

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update URL when view changes
  useEffect(() => {
    window.location.hash = `#/${view}`;
  }, [view]);

  // Removed automatic hash-based switching that might conflict with our new role-based logic
  useEffect(() => {
    if (user) {
      const isPrivileged = user.role === 'master' || user.role === 'admin' || user.role === 'subadmin' || user.role === 'account_admin';
      if (!isPrivileged && view === 'admin') {
         setView('chat');
      }
    }
  }, [user, view]);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
    }
  }, [theme]);

  // Poll backend health every 15 seconds
  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        await healthCheck();
        if (mounted) setBackend(true);
      } catch {
        if (mounted) setBackend(false);
      }
    }

    check();
    const interval = setInterval(check, 15_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Sync data when user changes
  useEffect(() => {
    if (user) {
      loadChatData();
    }
  }, [user]);

  async function loadChatData() {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const [hist, docs] = await Promise.all([
        import('./api').then(m => m.getChatHistory(user.username)),
        import('./api').then(m => m.getUserDocuments(user.username))
      ]);
      setHistoryData(hist);
      setLibraryDocs(docs);
    } catch (e) {
      console.error("Failed to load chat data:", e);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleDownloadPDF = async () => {
    let sessionName = 'Current Chat Session';
    if (sessionId) {
      const savedSessionMsg = historyData.find(h => h.session_id === sessionId);
      if (savedSessionMsg && savedSessionMsg.session_title) {
        sessionName = savedSessionMsg.session_title;
      } else if (messages.length > 0) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
          sessionName = firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
        }
      }
    }
    const dateStr = new Date().toLocaleString();

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
        setTimeout(resolve, 3000);
      });
    }

    if (!window.html2pdf) {
      alert("Failed to load PDF library. Please check your internet connection.");
      return;
    }

    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background: #ffffff; padding: 30px;">
        <h1 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 5px; font-size: 24px;">Chat Session Name: ${sessionName}</h1>
        <div style="color: #64748b; font-size: 13px; margin-bottom: 30px;">Date & Time Exported: ${dateStr}</div>
        ${messages.map(msg => `
          <div style="margin-bottom: 24px; padding: 16px; border-radius: 12px; ${msg.role === 'user' ? 'background: #f8fafc; border: 1px solid #e2e8f0;' : 'background: #ffffff; border-left: 4px solid #8b5cf6; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;'}">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px; display: flex; justify-content: space-between;">
              <span style="color: ${msg.role === 'user' ? '#3b82f6' : '#8b5cf6'}">${msg.role === 'user' ? (user?.preferred_name || user?.name || 'User') : 'Enterprise Policy Assistant'}</span>
              <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">${msg.time || ''}</span>
            </div>
            <div style="white-space: pre-wrap; font-size: 14px; color: #334155; line-height: 1.6;">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
      </div>
    `;

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `${sessionName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().from(htmlContent).set(opt).save();
  };

  return (
    <div className={`flex w-full h-screen overflow-hidden ${!user ? 'bg-slate-50 dark:bg-dark-950' : 'bg-slate-50 dark:bg-dark-900'} text-slate-800 dark:text-white transition-colors`} style={{ fontFamily: `"${fontStyle}", system-ui, sans-serif` }}>
      {/* Ambient gradient blobs (only show in dark mode / when logged in) */}
      {user && (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/8 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-purple-700/6 blur-3xl" />
        </div>
      )}

      {(!user && view !== 'forgot-password' && view !== 'register') && (
        <LoginScreen 
          onLogin={(userData, initialView) => {
            setUser(userData);
            setView(initialView);
          }} 
          onForgotPassword={() => setView('forgot-password')} 
          onRegister={() => setView('register')} 
        />
      )}

      {view === 'forgot-password' && (
        <ForgotPassword onBack={() => setView('chat')} />
      )}

      {view === 'register' && (
        <Register onBack={() => setView('chat')} onComplete={setUser} />
      )}

      {view === 'setup' && user && (
        <div className="flex w-full h-screen items-center justify-center p-8 bg-slate-50 dark:bg-dark-950 relative z-50">
          <SetupProfile user={user} onComplete={(updatedUser) => {
            setUser(updatedUser);
            const isPriv = updatedUser.role === 'master' || updatedUser.role === 'admin' || updatedUser.role === 'subadmin';
            setView(isPriv ? 'admin' : 'chat');
          }} />
        </div>
      )}

      {user && view !== 'setup' && (
        <>
          <Sidebar 
            activeView={view} 
            onViewChange={setView} 
            backendOk={backendOk} 
            role={user.role} 
            user={user}
            historyData={historyData}
            libraryDocs={libraryDocs}
            activeSessionId={sessionId}
            onSelectSession={(session) => {
              setSessionId(session.id);
              setMessages(session.messages);
              setSaveChat(true);
              setView('chat');
            }}
            onNewChat={() => {
              setSessionId('');
              setMessages([]);
              setSaveChat(false);
              setView('chat');
            }}
            onRefreshData={loadChatData}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            onLogout={() => {
              setUser(null);
              setHistoryData([]);
              setLibraryDocs([]);
              setMessages([]);
              setSessionId('');
            }}
            textSize={textSize}
            setTextSize={setTextSize}
            userBubbleColor={userBubbleColor}
            setUserBubbleColor={setUserBubbleColor}
            aiBubbleColor={aiBubbleColor}
            setAiBubbleColor={setAiBubbleColor}
            fontStyle={fontStyle}
            setFontStyle={setFontStyle}
            onViewPdf={setViewPdfUrl}
          />

          <main className="flex flex-col flex-1 h-screen overflow-hidden relative z-10 w-full min-w-0">
            {/* Top Header Bar */}
            <header className="h-20 flex items-center justify-between px-8 bg-white/50 dark:bg-dark-900/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shrink-0 transition-colors">
              <div className="flex items-center gap-4">
                {view === 'admin' && (
                  <>
                    <div className="h-10 w-[3px] bg-brand-500 rounded-full hidden lg:block" />
                    <div>
                      <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-widest uppercase">
                        {user.role === 'subadmin' ? 'Sub-Admin Dashboard' : 'Admin Dashboard'}
                      </h1>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Manage knowledge base documents and system logs
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                {view === 'chat' && messages.length > 0 && (
                   <button 
                     onClick={handleDownloadPDF} 
                     className="p-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition flex items-center gap-2"
                     title="Download Chat"
                   >
                     <Download className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                     <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold hidden sm:inline">Download Chat</span>
                   </button>
                )}
              </div>
            </header>

            <div className={view === 'chat' ? 'flex flex-col flex-1 h-full overflow-hidden' : 'hidden'}>
              <ChatView 
                user={user} 
                historyData={historyData} 
                libraryDocs={libraryDocs}
                sessionId={sessionId}
                setSessionId={setSessionId}
                messages={messages}
                setMessages={setMessages}
                saveChat={saveChat}
                setSaveChat={setSaveChat}
                onRefreshHistory={loadChatData}
                textSize={textSize}
                userBubbleColor={userBubbleColor}
                aiBubbleColor={aiBubbleColor}
                onViewPdf={setViewPdfUrl}
              />
            </div>
            
            <div className={view === 'admin' && (user.role === 'master' || user.role === 'admin' || user.role === 'subadmin' || user.role === 'account_admin') ? 'flex flex-col flex-1 h-full overflow-hidden' : 'hidden'}>
              <AdminDashboard user={user} role={user.role} />
            </div>

            {/* Global Footer - sits naturally inside main (chat area), centered within chat area only */}
            <footer className="py-3 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-dark-900/80 backdrop-blur-sm text-center shrink-0 w-full transition-colors">
               <p className="text-[10px] text-slate-500 dark:text-slate-500 tracking-wide font-normal">
                 © 2026 Lumina AI. All rights reserved.
               </p>
               <p className="text-[10px] text-slate-500 dark:text-slate-500 tracking-wide font-normal mt-1">
                 Developed by Himasha Jayamanna
               </p>
            </footer>
          </main>
          
          {/* NDA / Terms Modal */}
          {user && !hasAgreedTerms && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-dark-900/80 backdrop-blur-md p-4 transition-colors">
               <div className="bg-white dark:bg-dark-800 border border-brand-500/30 shadow-[0_10px_50px_rgba(139,92,246,0.1)] dark:shadow-[0_0_50px_rgba(139,92,246,0.15)] rounded-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col items-center text-center animate-fade-in relative overflow-y-auto custom-scrollbar max-h-[95vh] transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 shrink-0"></div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4 shrink-0">
                     <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500 dark:text-brand-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-1 shrink-0">Enterprise Policy Assistant</h2>
                  <h3 className="text-sm font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-6">Confidentiality Agreement</h3>
                  
                  <div className="space-y-4 text-left w-full mb-8">
                     <div className="bg-slate-50 dark:bg-dark-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:border-brand-500/30 transition-colors">
                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-rose-500 dark:text-rose-400"/> Strict Confidentiality</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">This is the official internal system of Enterprise Finance Corporation. Sharing policies, documents, or AI responses with external parties is strictly prohibited.</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-dark-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:border-brand-500/30 transition-colors">
                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500 dark:text-blue-400"/> Authorized Usage</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">This AI assistant must be used exclusively for official Enterprise duties. Do not use it for personal inquiries or non-work-related tasks.</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-dark-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:border-brand-500/30 transition-colors">
                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400"/> Disclaimer</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">While the Enterprise Policy Assistant offers quick guidance, its automated responses must not be exclusively relied upon for critical decisions. Users are strictly advised to consult the original Enterprise policy documents and cross-check with the appropriate responsible authorities before taking any action.</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-dark-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:border-brand-500/30 transition-colors">
                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500 dark:text-amber-400"/> Data Retention</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">To ensure data security and compliance, any chat session that remains inactive for 30 days will have its history automatically and permanently deleted from the system.</p>
                     </div>
                  </div>
                  
                  <div 
                    onClick={() => setIsTermsChecked(!isTermsChecked)}
                    className="w-full mb-5 flex items-start gap-3 bg-slate-50 dark:bg-dark-900/30 p-3 rounded-lg border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900/50 transition-colors group"
                  >
                    <div 
                      className={`mt-1 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-colors border-2 ${isTermsChecked ? 'bg-brand-500 border-brand-500' : 'bg-transparent border-slate-300 dark:border-slate-400 group-hover:border-brand-500 dark:group-hover:border-slate-500'}`}
                    >
                       {isTermsChecked && <Check className="w-3 h-3" style={{ color: '#ffffff' }} strokeWidth={4} />}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 text-left leading-relaxed select-none">
                      I have read and understood the terms above and agree to comply with Enterprise data policies.
                    </p>
                  </div>

                  <button 
                     disabled={!isTermsChecked}
                     onClick={() => {
                        localStorage.setItem(`enterprise_terms_agreed_${user.username}`, 'true');
                        setHasAgreedTerms(true);
                     }}
                     className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg flex justify-center items-center gap-2 transition-all ${isTermsChecked ? 'btn-primary shadow-brand-500/25 active:scale-95 cursor-pointer' : 'bg-slate-100 dark:bg-dark-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                  >
                     I Agree & Continue <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
             </div>
          )}

           {/* PDF Viewer Modal */}
           {viewPdfUrl && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-900/90 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-400" />
                      Document Viewer
                    </h3>
                    <button onClick={() => setViewPdfUrl(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="pdf-iframe-wrapper flex-1 w-full" style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
                    <iframe 
                      src={`${viewPdfUrl}#toolbar=0&navpanes=0`} 
                      className="w-full h-full border-0" 
                      style={{ 
                        backgroundColor: '#ffffff',
                        background: '#ffffff',
                        colorScheme: 'light',
                        filter: 'none',
                        WebkitFilter: 'none'
                      }}
                      data-darkreader-ignore="true"
                      title="PDF Viewer" 
                    />
                  </div>
                </div>
              </div>
           )}
        </>
      )}
    </div>
  );
}
