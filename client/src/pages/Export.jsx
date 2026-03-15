import { apiFetch } from '../utils';

export default function Export() {
  const download = async (endpoint, filename) => {
    try {
      const data = await apiFetch(`/${endpoint}`).then(r => r.json());
      if (!data || !data.length) return alert('No data to export right now.');
      
      const keys = Object.keys(data[0]);
      const csv = [
        keys.join(','), 
        ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = filename; 
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error exporting data.");
    }
  };

  const exports = [
    { label: 'Clients Roster', icon: '👥', endpoint: 'clients', file: 'clients_export.csv', desc: 'All client names, phone numbers, and email addresses.' },
    { label: 'Workshops Schedule', icon: '🗓️', endpoint: 'workshops', file: 'workshops_export.csv', desc: 'All workshops with dates, types, capacities, and pricing.' },
    { label: 'Registrations Log', icon: '📋', endpoint: 'registrations', file: 'registrations_export.csv', desc: 'A complete timeline of who registered for what and when.' },
    { label: 'Payments Ledger', icon: '💳', endpoint: 'payments', file: 'payments_export.csv', desc: 'Financial records tracking due amounts and payment statuses.' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Export Data</h1>
        <p className="text-slate-500 text-base max-w-2xl">Download your application tables directly into standard CSV format. These files can be opened seamlessly in Microsoft Excel, Apple Numbers, or imported into other tools.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {exports.map((e, index) => (
          <div 
            key={e.label} 
            className="group bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md hover:ring-blue-200 transition-all duration-300 animate-in slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
              {e.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">{e.label}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{e.desc}</p>
            </div>
            <button 
              onClick={() => download(e.endpoint, e.file)} 
              className="mt-4 md:mt-0 w-full md:w-auto bg-white text-slate-700 ring-1 ring-slate-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95 whitespace-nowrap flex items-center justify-center gap-2"
            >
              ⬇ <span className="mb-0.5">Download CSV</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
