import { useState, useEffect } from 'react';
import { apiFetch, fmt } from '../utils';
import { Modal } from '../components/Shared';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | clientObj
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const load = (search = '') => apiFetch(`/clients?q=${search}`).then(r => r.json()).then(setClients);
  
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', phone: '', email: '', notes: '' }); setModal('add'); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '' }); setModal(c); };

  const save = async () => {
    // Basic validation
    if (!form.name.trim()) return alert("Name is required");
    
    // UI/UX rule: loading state could go here
    if (modal === 'add') {
      await apiFetch('/clients', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    } else {
      await apiFetch(`/clients/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    }
    setModal(null); 
    load(q);
  };

  const del = async (id) => { 
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) return; 
    await apiFetch(`/clients/${id}`, { method: 'DELETE' }); 
    load(q); 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Clients Directory</h1>
          <p className="text-slate-500">Manage your students and their contact information.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95 flex-shrink-0"
        >
          + Add Client
        </button>
      </div>

      <div className="mb-6 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input 
          value={q} 
          onChange={e => { setQ(e.target.value); load(e.target.value); }} 
          placeholder="Search by name, phone, or email..." 
          className="w-full md:max-w-md border-0 ring-1 ring-slate-200 bg-white rounded-xl pl-11 pr-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" 
        />
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="text-4xl mb-4 opacity-50">👥</div>
            {q ? 'No clients found matching your search.' : 'Your client directory is empty. Click "+ Add Client" to add someone.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 font-bold">Name</th>
                  <th className="text-left px-6 py-4 font-bold">Contact</th>
                  <th className="text-left px-6 py-4 font-bold">Member Since</th>
                  <th className="text-right px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors animate-in slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium">{c.phone || '—'}</div>
                      <div className="text-slate-400 text-xs">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{fmt(c.created_at)}</td>
                    <td className="px-6 py-4 flex gap-3 justify-end items-center h-full mt-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 text-[13px] font-bold transition-colors">Edit</button>
                      <button onClick={() => del(c.id)} className="text-red-500 hover:text-red-700 text-[13px] font-bold transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add New Client' : 'Edit Client Profile'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="e.g. Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="010..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="name@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes (Optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" placeholder="Any special requirements or notes..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={save} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Save Client</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
