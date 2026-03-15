import { useState, useEffect } from 'react';
import { apiFetch, fmt, fmtMoney, typeBadge } from '../utils';
import { Modal } from '../components/Shared';

export default function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [modal, setModal] = useState(null);
  const empty = { title: '', type: 'other', date: '', time: '', capacity: 20, price: 0, instructor: '', notes: '' };
  const [form, setForm] = useState(empty);

  const load = () => apiFetch('/workshops').then(r => r.json()).then(setWorkshops);
  
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (w) => { setForm({ title: w.title, type: w.type, date: w.date, time: w.time || '', capacity: w.capacity, price: w.price, instructor: w.instructor || '', notes: w.notes || '' }); setModal(w); };

  const save = async () => {
    if (!form.title.trim()) return alert("Title is required");
    if (!form.date) return alert("Date is required");

    if (modal === 'add') {
      await apiFetch('/workshops', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    } else {
      await apiFetch(`/workshops/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    }
    setModal(null); 
    load();
  };

  const del = async (id) => { 
    if (!window.confirm('Are you sure you want to delete this workshop? Registered students will also be removed.')) return; 
    await apiFetch(`/workshops/${id}`, { method: 'DELETE' }); 
    load(); 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Workshops</h1>
          <p className="text-slate-500">Schedule classes and manage capacity.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95 flex-shrink-0"
        >
          + Add Workshop
        </button>
      </div>

      {workshops.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm p-16 text-center text-slate-500">
          <div className="text-4xl mb-4 opacity-50">🗓️</div>
          No workshops scheduled yet. Click "+ Add Workshop" to create one.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workshops.map((w, i) => {
            const fullness = Math.min(100, (w.registered / w.capacity) * 100);
            const isFull = fullness >= 100;

            return (
              <div 
                key={w.id} 
                className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow animate-in slide-up relative overflow-hidden group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Decorative background gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2">{w.title}</h3>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${typeBadge[w.type] || typeBadge.other}`}>
                      {w.type}
                    </span>
                  </div>
                  
                  {/* Action Menu (Visible on hover on desktop, always on mobile) */}
                  <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(w)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => del(w.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <div className="text-sm font-medium text-slate-600 space-y-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">📅</span> {fmt(w.date)}{w.time ? ` • ${w.time}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">💰</span> {fmtMoney(w.price)}
                  </div>
                  {w.instructor && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">👤</span> {w.instructor}
                    </div>
                  )}
                </div>

                {/* Progress Bar styled according to capacity */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className={isFull ? 'text-red-600' : 'text-slate-500'}>
                      {isFull ? 'Sold Out' : `${w.registered} Registered`}
                    </span>
                    <span className="text-slate-400">{w.capacity} Max</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isFull ? 'bg-red-500' : fullness > 80 ? 'bg-orange-400' : 'bg-green-500'
                      }`} 
                      style={{ width: `${fullness}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Create New Workshop' : 'Edit Workshop'} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Workshop Title <span className="text-red-500">*</span></label>
              <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="e.g. Intro to Pottery" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none cursor-pointer">
                <option value="other">General / Other</option>
                <option value="acting">Acting & Theater</option>
                <option value="painting">Painting & Arts</option>
                <option value="healing">Healing & Wellness</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price (EGP)</label>
              <input type="number" min="0" step="50" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Instructor Name</label>
              <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Who is teaching this?" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Additional Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border-0 ring-1 ring-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" placeholder="Requirements, material list, etc..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={save} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Save Workshop</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
