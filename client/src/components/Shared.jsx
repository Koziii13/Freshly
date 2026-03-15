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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      {/* Modal Content - glass effect, animate slide-up */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-up"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <span className="text-2xl leading-none block transform translate-y-[-2px]">&times;</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
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

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <aside className="w-64 min-h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col py-8 px-5 shrink-0 shadow-sm z-10 sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white text-xl">
          🎨
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">Workshop</h1>
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Manager</div>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 translate-x-1' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} strokeWidth={active ? 2.5 : 2} /> 
              {label}
            </button>
          )
        })}
      </nav>
      
      <div className="mt-auto pt-6 flex flex-col gap-3">
        {token && (
          <button 
            onClick={onLogout} 
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        )}
        <div className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 shadow-sm ${isLocal ? 'bg-green-50/50 border-green-200 text-green-700' : 'bg-blue-50/50 border-blue-200 text-blue-700'}`}>
          <span className={`w-2 h-2 rounded-full relative flex h-2 w-2`}>
             {isLocal && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
             <span className={`relative inline-flex rounded-full h-2 w-2 ${isLocal ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
          </span> 
          {isLocal ? 'Local Offline Mode' : 'Cloud Connected'}
        </div>
      </div>
    </aside>
  );
}
