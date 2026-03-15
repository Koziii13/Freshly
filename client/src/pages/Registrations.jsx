import { useState, useEffect } from 'react';
import { apiFetch, fmt, fmtMoney, typeBadge, badge } from '../utils';
import { Modal } from '../components/Shared';

export default function Registrations() {
  const [regs, setRegs] = useState([]);
  const [modal, setModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [form, setForm] = useState({ client_id: '', workshop_id: '' });
  const [err, setErr] = useState('');

  // SWR or Promise.all would be ideal here as per React rules
  const load = () => {
    Promise.all([
      apiFetch('/registrations').then(r => r.json()),
      apiFetch('/clients').then(r => r.json()),
      apiFetch('/workshops').then(r => r.json())
    ]).then(([r, c, w]) => {
      setRegs(r);
      setClients(c);
      setWorkshops(w);
    });
  };
  
  useEffect(() => { load(); }, []);

  const save = async () => {
    setErr('');
    if (!form.client_id || !form.workshop_id) return setErr('Please select both a client and a workshop.');

    const res = await apiFetch('/registrations', { 
      method: 'POST', 
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify({ client_id: Number(form.client_id), workshop_id: Number(form.workshop_id) }) 
    });
    
    const data = await res.json();
    if (!res.ok) { setErr(data.error); return; }
    
    setModal(false); 
    load(); // Reload to refresh capacities and the list
  };

  const del = async (id) => { 
    if (!window.confirm('Remove this registration? This will clear their spot in the class.')) return; 
    await apiFetch(`/registrations/${id}`, { method: 'DELETE' }); 
    load(); 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Registrations</h1>
          <p className="text-slate-500">Book clients into specific workshops.</p>
        </div>
        <button 
          onClick={() => { setForm({ client_id: '', workshop_id: '' }); setErr(''); setModal(true); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95 flex-shrink-0"
        >
          + Register Client
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
        {regs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="text-4xl mb-4 opacity-50">📋</div>
            No registrations yet. Link a client to a workshop to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 font-bold">Client Info</th>
                  <th className="text-left px-6 py-4 font-bold">Workshop enrolled</th>
                  <th className="text-left px-6 py-4 font-bold">Workshop Date</th>
                  <th className="text-left px-6 py-4 font-bold">Payment Status</th>
                  <th className="text-right px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors animate-in slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{r.client_name}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{r.client_phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 block mb-1.5">{r.workshop_title}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${typeBadge[r.workshop_type] || typeBadge.other}`}>
                        {r.workshop_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {fmt(r.workshop_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-block mb-1.5 ${badge[r.payment_status] || badge.pending}`}>
                        {r.payment_status || 'pending'}
                      </span>
                      <div className="text-xs font-semibold text-slate-400">{fmtMoney(r.payment_amount)}</div>
                    </td>
                    <td className="px-6 py-4 flex justify-end h-full mt-4">
                      <button onClick={() => del(r.id)} className="text-red-500 hover:text-red-700 text-[13px] font-bold transition-colors">Withdraw</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title="Book a Registration" onClose={() => setModal(false)}>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Student <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={form.client_id} 
                  onChange={e => setForm({ ...form, client_id: e.target.value })} 
                  className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none font-medium text-slate-700"
                >
                  <option value="" disabled>Choose a student...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Workshop <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={form.workshop_id} 
                  onChange={e => setForm({ ...form, workshop_id: e.target.value })} 
                  className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none font-medium text-slate-700"
                >
                  <option value="" disabled>Choose a class...</option>
                  {workshops.map(w => {
                    const isFull = w.registered >= w.capacity;
                    return (
                      <option key={w.id} value={w.id} disabled={isFull}>
                        {w.title} — {fmt(w.date)} • {isFull ? 'SOLD OUT' : `${w.capacity - w.registered} spots left`}
                      </option>
                    )
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* UX design rule: explicit error rendering */}
            {err && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-sm font-semibold rounded-xl px-4 py-3 flex items-start gap-2 shadow-sm animate-in fade-in slide-up">
                <span className="mt-0.5">⚠️</span> 
                {err}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={save} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Complete Registration</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
