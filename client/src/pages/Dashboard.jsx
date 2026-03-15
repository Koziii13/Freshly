import { useState, useEffect } from 'react';
import { ChevronRight, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiFetch, badge, fmtMoney } from '../utils';

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [rangeType, setRangeType] = useState('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Use React best practices: fetch on mount and on range changes
  useEffect(() => { 
    let url = '/payments/stats/summary';
    let start, end;
    const now = new Date();
    
    if (rangeType === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (rangeType === '3months') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (rangeType === 'year') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    } else if (rangeType === 'custom' && customRange.start && customRange.end) {
      start = customRange.start;
      end = customRange.end;
    }

    if (start && end) url += `?start=${start}&end=${end}`;
    else if (rangeType === 'custom') return; // wait for both dates

    setStats(null); // trigger loading state
    apiFetch(url).then(r => r.json()).then(setStats); 
  }, [rangeType, customRange]);
  
  const TrendBadge = ({ change }) => {
    if (change === null || change === undefined) return null;
    const isPositive = change > 0;
    const isZero = change === 0;
    
    if (isZero) return <span className="text-[11px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded ml-2 border border-white/5">--</span>;

    return (
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-2 border ${isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(change)}%
      </span>
    );
  };

  if (!stats) return <div className="p-10 text-slate-500 animate-pulse font-semibold">Loading dashboard data...</div>;
  
  const cards = [
    { label: 'Total Clients', value: stats.totalClients?.value ?? stats.totalClients, change: stats.totalClients?.change, color: 'glass-card text-emerald-400 ring-white/5', icon: '👥' },
    { label: 'Total Workshops', value: stats.totalWorkshops?.value ?? stats.totalWorkshops, change: stats.totalWorkshops?.change, color: 'glass-card text-blue-400 ring-white/5', icon: '🗓️' },
    { label: 'Upcoming', value: stats.upcomingWorkshops?.value ?? stats.upcomingWorkshops, change: stats.upcomingWorkshops?.change, color: 'glass-card text-indigo-400 ring-white/5', icon: '⏳' },
    { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue?.value ?? stats.totalRevenue), change: stats.totalRevenue?.change, color: 'glass-card text-emerald-300 ring-emerald-500/20', icon: '💰' },
    { label: 'Pending Payments', value: stats.pendingPayments?.value ?? stats.pendingPayments, change: stats.pendingPayments?.change, color: 'glass-card text-amber-400 ring-amber-500/20', icon: '⚠️' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Dashboard</h1>
          <p className="text-slate-400 text-base">Welcome back! Here's a quick overview of your studio.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-slate-900/40 p-2 rounded-2xl ring-1 ring-white/5 backdrop-blur-md shadow-2xl border border-white/5">
          <div className="flex items-center gap-2 px-3">
            <Calendar size={18} className="text-emerald-500" />
            <select 
              value={rangeType} 
              onChange={e => setRangeType(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-200 focus:outline-none appearance-none cursor-pointer pr-4 [&>option]:bg-slate-900"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {rangeType === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 border-l border-white/10 pl-3">
              <input 
                type="date" 
                value={customRange.start} 
                onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))}
                className="text-xs font-semibold text-slate-300 bg-slate-950/50 hover:bg-slate-900 px-3 py-1.5 rounded-lg ring-1 ring-white/10 border border-white/5 focus:outline-none focus:ring-emerald-500 transition-colors [color-scheme:dark]"
              />
              <span className="text-slate-500 text-xs font-bold">to</span>
              <input 
                type="date" 
                value={customRange.end} 
                onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))}
                className="text-xs font-semibold text-slate-300 bg-slate-950/50 hover:bg-slate-900 px-3 py-1.5 rounded-lg ring-1 ring-white/10 border border-white/5 focus:outline-none focus:ring-emerald-500 transition-colors [color-scheme:dark]"
              />
            </div>
          )}
        </div>
      </header>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
        {cards.map((c, i) => (
          <div 
            key={c.label} 
            className={`rounded-2xl p-4 ring-1 ring-inset ${c.color} flex flex-col gap-1.5 shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 animate-in slide-up relative overflow-hidden group`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-2xl mb-0.5 relative z-10">{c.icon}</span>
            <div className="flex items-baseline gap-2 relative z-10 flex-wrap">
              <span className="text-2xl font-black tracking-tight text-slate-100">{c.value}</span>
              <TrendBadge change={c.change} />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-widest relative z-10">{c.label}</span>
          </div>
        ))}
      </div>
      
      <div className="glass-panel rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Recent Registrations
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </h2>
          <button 
            onClick={() => setPage('registrations')} 
            className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:text-emerald-300 transition-colors group"
          >
            View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>
        
        {stats.recentRegistrations.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="text-4xl mb-3 opacity-50">📭</div>
            No registrations yet. <button onClick={() => setPage('registrations')} className="text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-emerald-900/50 underline-offset-4">Add your first one</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-widest border-b border-white/5 bg-slate-900/40">
                  <th className="text-left px-8 py-4 font-bold">Client</th>
                  <th className="text-left px-8 py-4 font-bold">Workshop</th>
                  <th className="text-left px-8 py-4 font-bold">Type</th>
                  <th className="text-left px-8 py-4 font-bold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentRegistrations.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-4 font-bold text-slate-200 group-hover:text-white transition-colors">{r.client_name}</td>
                    <td className="px-8 py-4 font-medium text-slate-400">{r.workshop_title}</td>

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
