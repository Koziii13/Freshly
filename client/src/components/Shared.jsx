import { useEffect, useState, useCallback } from 'react';
import { Settings as SettingsIcon, Download, CreditCard, BookOpen, Calendar, Users, LayoutDashboard, ChevronRight } from 'lucide-react';

export function Modal({ title, onClose, children }) {
  // Add ESC key listener for accessibility
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur - animate in */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      {/* Modal Content - glass effect, animate slide-up */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-up"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 id="modal-title" className="text-xl font-bold text-slate-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <span className="text-2xl leading-none block transform translate-y-[-2px]">&times;</span>
          </button>
        </div>
        <div className="p-6 text-slate-300">{children}</div>
      </div>
    </div>
  );
}

// Extract sidebar so we don't re-render it on every page change
export function Sidebar({ page, setPage, onLogout, token }) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'workshops', label: 'Workshops', icon: Calendar },
    { id: 'registrations', label: 'Registrations', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // App always uses Supabase cloud now — never local
  const [cloudStatus, setCloudStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'

  useEffect(() => {
    const checkCloud = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setCloudStatus(data.cloud ? 'connected' : 'offline');
      } catch {
        setCloudStatus('offline');
      }
    };
    checkCloud();
    const interval = setInterval(checkCloud, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-slate-900/40 backdrop-blur-2xl border-r border-white/5 flex flex-col py-8 px-5 shrink-0 shadow-lg z-10 sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold text-xl">
          W
        </div>
        <div>
          <h1 className="font-extrabold text-slate-100 text-lg leading-tight tracking-tight">Workshop</h1>
          <div className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-widest">Manager</div>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1.5 flex-1" aria-label="Main Navigation">
        {links.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button 
              key={id} 
              onClick={() => setPage(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active 
                  ? 'bg-white/10 text-emerald-300 shadow-sm border border-white/5 translate-x-1' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} strokeWidth={active ? 2.5 : 2} /> 
              {label}
            </button>
          )
        })}
      </nav>
      
      <div className="mt-auto pt-6 flex flex-col gap-3">
        {token && (
          <button 
            onClick={onLogout} 
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/5"
          >
            Sign Out
          </button>
        )}
        <div className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 shadow-sm bg-slate-950/50 ${
            cloudStatus === 'connected' ? 'border-blue-500/20 text-blue-400' :
            cloudStatus === 'offline'   ? 'border-red-500/20 text-red-400' :
                                          'border-slate-500/20 text-slate-400'
          }`}>
          <span className="w-2 h-2 rounded-full relative flex">
            {cloudStatus === 'connected' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              cloudStatus === 'connected' ? 'bg-blue-500' :
              cloudStatus === 'offline'   ? 'bg-red-500' :
                                            'bg-slate-500 animate-pulse'
            }`}></span>
          </span>
          {cloudStatus === 'connected' ? 'Cloud Connected' : cloudStatus === 'offline' ? 'Cloud Offline' : 'Connecting...'}
        </div>
      </div>
    </aside>
  );
}
