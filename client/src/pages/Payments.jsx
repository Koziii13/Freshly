import { useState, useEffect } from 'react';
import { apiFetch, fmt, fmtMoney, badge } from '../utils';
import { Modal } from '../components/Shared';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: '', amount: 0, notes: '' });

  const load = () => apiFetch('/payments').then(r => r.json()).then(setPayments);
  
  useEffect(() => { load(); }, []);

  const openEdit = (p) => { setForm({ status: p.status, amount: p.amount || 0, notes: p.notes || '' }); setEditing(p); };
  
  const markPaid = async (p) => {
    await apiFetch(`/payments/${p.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify({ status: 'paid', amount: p.amount, notes: p.notes }) 
    });
    load();
  };
  
  const save = async () => {
    await apiFetch(`/payments/${editing.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(form) 
    });
    setEditing(null); 
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Payments & Billing</h1>
        <p className="text-slate-500">Track revenue and outstanding balances.</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="text-4xl mb-4 opacity-50">💳</div>
            No payment history yet. Register clients to workshops to generate bills.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 font-bold">Client / Workshop</th>
                  <th className="text-left px-6 py-4 font-bold">Total Due</th>
                  <th className="text-left px-6 py-4 font-bold">Status</th>
                  <th className="text-left px-6 py-4 font-bold">Paid On</th>
                  <th className="text-right px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors animate-in slide-up" style={{ animationDelay: `${i * 15}ms` }}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{p.client_name}</div>
                      <div className="text-[13px] text-slate-500 font-medium">{p.workshop_title}</div>
                      <div className="text-xs text-slate-400">{fmt(p.workshop_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-base">{fmtMoney(p.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badge[p.status] || badge.pending}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-[13px]">
                      {p.paid_at ? fmt(p.paid_at) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 flex gap-3 justify-end items-center h-full mt-2">
                       {p.status !== 'paid' && (
                         <button 
                          onClick={() => markPaid(p)} 
                          className="text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors ring-1 ring-green-200"
                        >
                          ✓ Mark Paid
                        </button>
                      )}
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-[13px] font-bold transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title="Update Payment Status" onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Status <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value })} 
                  className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none font-medium text-slate-700"
                >
                  <option value="pending">⏳ Pending/Unpaid</option>
                  <option value="partial">🌗 Partial Payment</option>
                  <option value="paid">✅ Fully Paid</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Amount Owed (EGP)</label>
              <input 
                type="number" 
                min="0"
                step="10"
                value={form.amount} 
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })} 
                className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1.5 ml-1">Update this if a discount or late fee applies.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Notes / Method</label>
              <textarea 
                value={form.notes} 
                onChange={e => setForm({ ...form, notes: e.target.value })} 
                rows={2} 
                className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" 
                placeholder="e.g. Paid in cash, awaiting InstaPay transfer..." 
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={save} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Update Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
