import { useState } from 'react';

const API = `${window.location.origin}/api`;

export default function Login({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pass) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password: pass }) 
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.token);
      } else {
        setErr('Incorrect password. Please try again.');
        setPass('');
      }
    } catch (error) {
      setErr('Server connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      <div className="w-full max-w-[400px] animate-in fade-in slide-up hidden md:flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white text-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 blur-xl transform -skew-x-12 translate-x-3"></div>
          🎨
        </div>
        <div className="flex flex-col">
           <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Workshop</h1>
           <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manager Setup</span>
        </div>
      </div>

      <form 
        onSubmit={submit} 
        className="bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 w-full max-w-[400px] animate-in fade-in slide-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="text-center mb-8 md:hidden">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white text-2xl mx-auto mb-4">🎨</div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workshop Manager</h1>
        </div>

        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Please sign in to access your offline workspace.</p>
        </div>

        {err && (
          <div className="mt-6 mb-4 text-[13px] font-bold text-red-600 bg-red-50 ring-1 ring-red-100 p-3.5 rounded-xl flex items-start gap-2 animate-in slide-up">
            <span className="text-base leading-none">⚠️</span>
            {err}
          </div>
        )}

        <div className={`mt-8 mb-8 ${err ? 'mt-4' : ''}`}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Access Password</label>
          <div className="relative">
            <input 
              type="password" 
              value={pass} 
              onChange={e => { setPass(e.target.value); setErr(''); }} 
              autoFocus 
              className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-3.5 text-base font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!pass || loading}
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] inset-y-0 group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          {loading ? 'Authenticating...' : 'Unlock Workspace'}
        </button>
      </form>
      
      <p className="mt-8 text-xs font-semibold text-slate-400 tracking-wide text-center">
        Secured Offline Application • Localhost
      </p>
    </div>
  );
}
