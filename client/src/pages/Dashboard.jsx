import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiFetch, badge, typeBadge, fmtMoney } from '../utils';

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  
  // Use React best practices: single mount fetch for dashboard
  useEffect(() => { 
    apiFetch('/payments/stats/summary').then(r => r.json()).then(setStats); 
  }, []);
  
  if (!stats) return <div className="p-10 text-slate-400 animate-pulse">Loading dashboard...</div>;
  
  const cards = [
    { label: 'Total Clients', value: stats.totalClients, color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-blue-500/20', icon: '👥' },
    { label: 'Total Workshops', value: stats.totalWorkshops, color: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 ring-purple-500/20', icon: '🗓️' },
    { label: 'Upcoming', value: stats.upcomingWorkshops, color: 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 ring-teal-500/20', icon: '⏳' },
    { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue), color: 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 ring-green-500/20', icon: '💰' },
    { label: 'Pending Payments', value: stats.pendingPayments, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 ring-yellow-500/20', icon: '⚠️' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-500 text-base">Welcome back! Here's a quick overview of your studio.</p>
      </header>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
        {cards.map((c, i) => (
          <div 
            key={c.label} 
            className={`rounded-2xl p-6 ring-1 ring-inset ${c.color} flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-in slide-up`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
          >
            <span className="text-3xl mb-1">{c.icon}</span>
            <span className="text-3xl font-black tracking-tight">{c.value}</span>
            <span className="text-sm font-semibold opacity-80 uppercase tracking-wide">{c.label}</span>
          </div>
        ))}
      </div>
      
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <h2 className="text-lg font-bold text-slate-800">Recent Registrations</h2>
          <button 
            onClick={() => setPage('registrations')} 
            className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-800 transition-colors group"
          >
            View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>
        
        {stats.recentRegistrations.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="text-4xl mb-3">📭</div>
            No registrations yet. <button onClick={() => setPage('registrations')} className="text-blue-600 hover:text-blue-800 font-semibold underline decoration-blue-200 underline-offset-4">Add your first one</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-8 py-4 font-bold">Client</th>
                  <th className="text-left px-8 py-4 font-bold">Workshop</th>
                  <th className="text-left px-8 py-4 font-bold">Type</th>
                  <th className="text-left px-8 py-4 font-bold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-800">{r.client_name}</td>
                    <td className="px-8 py-4 font-medium text-slate-600">{r.workshop_title}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${typeBadge[r.workshop_type] || typeBadge.other}`}>
                        {r.workshop_type}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badge[r.payment_status] || badge.pending}`}>
                        {r.payment_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
