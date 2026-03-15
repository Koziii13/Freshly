import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, CreditCard, Download, LayoutDashboard, ChevronRight, Settings as SettingsIcon } from 'lucide-react';

const API = `${window.location.origin}/api`;

// ─── Auth & Fetch Wrapper ───────────────────────────────────────────────────
const getAuthToken = () => localStorage.getItem('workshop_auth_token');
const setAuthToken = (token) => {
  if (token) localStorage.setItem('workshop_auth_token', token);
  else localStorage.removeItem('workshop_auth_token');
};

async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    'Authorization': token ? `Basic ${token}` : '',
  };
  
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  
  if (res.status === 401 && endpoint !== '/auth/login') {
    setAuthToken(null);
    window.location.reload();
    throw new Error('Unauthorized');
  }
  
  return res;
}

// ─── Shared helpers ─────────────────────────────────────────────────────────
const badge = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', partial: 'bg-orange-100 text-orange-700' };
const typeBadge = { acting: 'bg-purple-100 text-purple-700', painting: 'bg-blue-100 text-blue-700', healing: 'bg-teal-100 text-teal-700', other: 'bg-gray-100 text-gray-700' };
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtMoney = (n) => `EGP ${Number(n || 0).toLocaleString()}`;

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'workshops', label: 'Workshops', icon: Calendar },
    { id: 'registrations', label: 'Registrations', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const logout = () => {
    setAuthToken(null);
    window.location.reload();
  };

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col py-8 px-4 shrink-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <span className="text-3xl">🎨</span>
        <div>
          <div className="font-extrabold text-slate-800 text-lg leading-tight">Workshop</div>
          <div className="text-xs text-slate-400 font-medium">Manager</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${page === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 flex flex-col gap-2">
        {getAuthToken() && (
          <button onClick={logout} className="text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            Logout
          </button>
        )}
        <div className={`px-2 py-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${isLocal ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          <span className={`w-2 h-2 rounded-full inline-block ${isLocal ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span> 
          {isLocal ? 'Local Mode' : 'Cloud / Network'}
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { apiFetch('/payments/stats/summary').then(r => r.json()).then(setStats); }, []);
  if (!stats) return <div className="p-10 text-slate-400">Loading…</div>;
  const cards = [
    { label: 'Total Clients', value: stats.totalClients, color: 'bg-blue-50 text-blue-700', icon: '👥' },
    { label: 'Total Workshops', value: stats.totalWorkshops, color: 'bg-purple-50 text-purple-700', icon: '🗓️' },
    { label: 'Upcoming', value: stats.upcomingWorkshops, color: 'bg-teal-50 text-teal-700', icon: '⏳' },
    { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue), color: 'bg-green-50 text-green-700', icon: '💰' },
    { label: 'Pending Payments', value: stats.pendingPayments, color: 'bg-yellow-50 text-yellow-700', icon: '⚠️' },
  ];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Welcome back! Here's what's happening.</p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {cards.map(c => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.color} flex flex-col gap-1`}>
            <span className="text-2xl">{c.icon}</span>
            <span className="text-2xl font-extrabold">{c.value}</span>
            <span className="text-xs font-semibold opacity-75">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-700">Recent Registrations</h2>
          <button onClick={() => setPage('registrations')} className="text-blue-600 text-sm font-semibold flex items-center gap-1">View all <ChevronRight size={16}/></button>
        </div>
        {stats.recentRegistrations.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No registrations yet. <button onClick={() => setPage('registrations')} className="text-blue-500 font-semibold">Add one?</button></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase border-b">
              <th className="text-left px-6 py-3 font-semibold">Client</th>
              <th className="text-left px-6 py-3 font-semibold">Workshop</th>
              <th className="text-left px-6 py-3 font-semibold">Type</th>
              <th className="text-left px-6 py-3 font-semibold">Payment</th>
            </tr></thead>
            <tbody>{stats.recentRegistrations.map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold text-slate-800">{r.client_name}</td>
                <td className="px-6 py-3 text-slate-600">{r.workshop_title}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeBadge[r.workshop_type] || typeBadge.other}`}>{r.workshop_type}</span></td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge[r.payment_status] || badge.pending}`}>{r.payment_status || 'pending'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Clients ─────────────────────────────────────────────────────────────────
function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | clientObj
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const load = (search = '') => apiFetch(`/clients?q=${search}`).then(r => r.json()).then(setClients);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', phone: '', email: '', notes: '' }); setModal('add'); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '' }); setModal(c); };

  const save = async () => {
    if (modal === 'add') await apiFetch('/clients', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    else await apiFetch(`/clients/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    setModal(null); load(q);
  };

  const del = async (id) => { if (!confirm('Delete this client?')) return; await apiFetch(`/clients/${id}`, { method: 'DELETE' }); load(q); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Clients</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700 transition">+ Add Client</button>
      </div>
      <input value={q} onChange={e => { setQ(e.target.value); load(e.target.value); }} placeholder="Search by name, phone, email…" className="mb-5 w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {clients.length === 0 ? <div className="p-10 text-center text-slate-400">No clients yet. Click <strong>+ Add Client</strong> to get started.</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase border-b">
              <th className="text-left px-6 py-3 font-semibold">Name</th>
              <th className="text-left px-6 py-3 font-semibold">Phone</th>
              <th className="text-left px-6 py-3 font-semibold">Email</th>
              <th className="text-left px-6 py-3 font-semibold">Added</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody>{clients.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold text-slate-800">{c.name}</td>
                <td className="px-6 py-3 text-slate-500">{c.phone || '—'}</td>
                <td className="px-6 py-3 text-slate-500">{c.email || '—'}</td>
                <td className="px-6 py-3 text-slate-400 text-xs">{fmt(c.created_at)}</td>
                <td className="px-6 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
                  <button onClick={() => del(c.id)} className="text-red-400 hover:text-red-600 text-xs font-semibold">Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Add Client' : 'Edit Client'} onClose={() => setModal(null)}>
          {['name', 'phone', 'email'].map(f => (
            <div key={f} className="mb-4">
              <label className="block text-sm font-semibold text-slate-600 mb-1 capitalize">{f}{f === 'name' && ' *'}</label>
              <input value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow hover:bg-blue-700">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Workshops ───────────────────────────────────────────────────────────────
function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [modal, setModal] = useState(null);
  const empty = { title: '', type: 'other', date: '', time: '', capacity: 20, price: 0, instructor: '', notes: '' };
  const [form, setForm] = useState(empty);

  const load = () => apiFetch('/workshops').then(r => r.json()).then(setWorkshops);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (w) => { setForm({ title: w.title, type: w.type, date: w.date, time: w.time || '', capacity: w.capacity, price: w.price, instructor: w.instructor || '', notes: w.notes || '' }); setModal(w); };

  const save = async () => {
    if (modal === 'add') await apiFetch('/workshops', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    else await apiFetch(`/workshops/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    setModal(null); load();
  };

  const del = async (id) => { if (!confirm('Delete this workshop?')) return; await apiFetch(`/workshops/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Workshops</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700">+ Add Workshop</button>
      </div>
      {workshops.length === 0 ? <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">No workshops yet. Click <strong>+ Add Workshop</strong>.</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workshops.map(w => (
            <div key={w.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800">{w.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadge[w.type] || typeBadge.other}`}>{w.type}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(w)} className="text-blue-500 text-xs font-semibold hover:text-blue-700">Edit</button>
                  <button onClick={() => del(w.id)} className="text-red-400 text-xs font-semibold hover:text-red-600">Delete</button>
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                <div>📅 {fmt(w.date)}{w.time ? ` at ${w.time}` : ''}</div>
                <div>👥 {w.registered}/{w.capacity} registered</div>
                <div>💰 {fmtMoney(w.price)}</div>
                {w.instructor && <div>👤 {w.instructor}</div>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (w.registered / w.capacity) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Workshop' : 'Edit Workshop'} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {['acting', 'painting', 'healing', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Price (EGP)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Instructor</label>
              <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow hover:bg-blue-700">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Registrations ───────────────────────────────────────────────────────────
function Registrations() {
  const [regs, setRegs] = useState([]);
  const [modal, setModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [form, setForm] = useState({ client_id: '', workshop_id: '' });
  const [err, setErr] = useState('');

  const load = () => apiFetch('/registrations').then(r => r.json()).then(setRegs);
  useEffect(() => {
    load();
    apiFetch('/clients').then(r => r.json()).then(setClients);
    apiFetch('/workshops').then(r => r.json()).then(setWorkshops);
  }, []);

  const save = async () => {
    setErr('');
    const res = await apiFetch('/registrations', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ client_id: Number(form.client_id), workshop_id: Number(form.workshop_id) }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error); return; }
    setModal(false); load();
  };

  const del = async (id) => { if (!confirm('Remove this registration?')) return; await apiFetch(`/registrations/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Registrations</h1>
        <button onClick={() => { setForm({ client_id: '', workshop_id: '' }); setErr(''); setModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-700">+ Register Client</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {regs.length === 0 ? <div className="p-10 text-center text-slate-400">No registrations yet.</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase border-b">
              <th className="text-left px-6 py-3 font-semibold">Client</th>
              <th className="text-left px-6 py-3 font-semibold">Workshop</th>
              <th className="text-left px-6 py-3 font-semibold">Date</th>
              <th className="text-left px-6 py-3 font-semibold">Payment</th>
              <th className="text-left px-6 py-3 font-semibold">Registered</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody>{regs.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold text-slate-800">{r.client_name}<br/><span className="text-xs text-slate-400 font-normal">{r.client_phone}</span></td>
                <td className="px-6 py-3 text-slate-700">{r.workshop_title}<br/><span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${typeBadge[r.workshop_type] || typeBadge.other}`}>{r.workshop_type}</span></td>
                <td className="px-6 py-3 text-slate-500">{fmt(r.workshop_date)}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge[r.payment_status] || badge.pending}`}>{r.payment_status || 'pending'}</span><br/><span className="text-xs text-slate-400">{fmtMoney(r.payment_amount)}</span></td>
                <td className="px-6 py-3 text-slate-400 text-xs">{fmt(r.registered_at)}</td>
                <td className="px-6 py-3"><button onClick={() => del(r.id)} className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="Register Client to Workshop" onClose={() => setModal(false)}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Client *</label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Workshop *</label>
            <select value={form.workshop_id} onChange={e => setForm({ ...form, workshop_id: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Select workshop…</option>
              {workshops.map(w => <option key={w.id} value={w.id}>{w.title} — {fmt(w.date)} ({w.registered}/{w.capacity})</option>)}
            </select>
          </div>
          {err && <div className="mb-4 text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{err}</div>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow hover:bg-blue-700">Register</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function Payments() {
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: '', amount: 0, notes: '' });

  const load = () => apiFetch('/payments').then(r => r.json()).then(setPayments);
  useEffect(() => { load(); }, []);

  const openEdit = (p) => { setForm({ status: p.status, amount: p.amount || 0, notes: p.notes || '' }); setEditing(p); };
  const markPaid = async (p) => {
    await apiFetch(`/payments/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ status: 'paid', amount: p.amount, notes: p.notes }) });
    load();
  };
  const save = async () => {
    await apiFetch(`/payments/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(form) });
    setEditing(null); load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Payments</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {payments.length === 0 ? <div className="p-10 text-center text-slate-400">No payments yet. Register clients to workshops first.</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase border-b">
              <th className="text-left px-6 py-3 font-semibold">Client</th>
              <th className="text-left px-6 py-3 font-semibold">Workshop</th>
              <th className="text-left px-6 py-3 font-semibold">Amount</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-left px-6 py-3 font-semibold">Paid On</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody>{payments.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold text-slate-800">{p.client_name}</td>
                <td className="px-6 py-3 text-slate-600">{p.workshop_title}<br/><span className="text-xs text-slate-400">{fmt(p.workshop_date)}</span></td>
                <td className="px-6 py-3 font-semibold text-slate-700">{fmtMoney(p.amount)}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge[p.status] || badge.pending}`}>{p.status}</span></td>
                <td className="px-6 py-3 text-slate-400 text-xs">{p.paid_at ? fmt(p.paid_at) : '—'}</td>
                <td className="px-6 py-3 flex gap-2">
                  {p.status !== 'paid' && <button onClick={() => markPaid(p)} className="text-green-600 hover:text-green-800 text-xs font-bold bg-green-50 px-3 py-1 rounded-lg">✓ Mark Paid</button>}
                  <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {editing && (
        <Modal title="Edit Payment" onClose={() => setEditing(null)}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Amount (EGP)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow hover:bg-blue-700">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
function Export() {
  const download = async (endpoint, filename) => {
    const data = await apiFetch(`/${endpoint}`).then(r => r.json());
    if (!data.length) return alert('No data to export.');
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exports = [
    { label: 'Clients', icon: '👥', endpoint: 'clients', file: 'clients.csv', desc: 'All client names, phones, and emails' },
    { label: 'Workshops', icon: '🗓️', endpoint: 'workshops', file: 'workshops.csv', desc: 'All workshops with dates, types, and prices' },
    { label: 'Registrations', icon: '📋', endpoint: 'registrations', file: 'registrations.csv', desc: 'All registrations with client and workshop info' },
    { label: 'Payments', icon: '💳', endpoint: 'payments', file: 'payments.csv', desc: 'All payments with status and amounts' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Export Data</h1>
      <p className="text-slate-400 text-sm mb-8">Download any table as a CSV file you can open in Excel or share externally.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {exports.map(e => (
          <div key={e.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
            <span className="text-4xl">{e.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-slate-800">{e.label}</div>
              <div className="text-sm text-slate-400">{e.desc}</div>
            </div>
            <button onClick={() => download(e.endpoint, e.file)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow transition whitespace-nowrap">⬇ Export CSV</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function Settings() {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/settings').then(r => r.json()).then(data => setUrl(data.webhook_url || ''));
  }, []);

  const save = async () => {
    await apiFetch('/settings/webhook', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ url }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    if (!url) return alert('Please enter and save a URL first.');
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          client_name: 'Ahmed Test (Webhook Test)',
          client_phone: '01012345678',
          workshop_title: 'Test Connection',
          workshop_date: '2026-04-01',
          price: 500
        })
      });
      alert('Test sent successfully! Check your Google Sheet.');
    } catch (err) {
      alert('Failed to send test. Did you deploy your Apps Script correctly?');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Settings</h1>
      <p className="text-slate-400 text-sm mb-8">Configure automatic Google Sheets backup.</p>
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><span className="text-xl">📊</span> Auto-Populate Google Sheets</h3>
        <p className="text-sm text-slate-500 mb-4 lh-relaxed">
          Want your registrations to automatically appear in an online Google Sheet without using Excel? 
          Paste the Google Apps Script Webhook URL here. Every time you register a client, it will automatically insert a new row.
        </p>

        <label className="block text-sm font-semibold text-slate-600 mb-1">Webhook URL</label>
        <div className="flex gap-2">
          <input 
            value={url} onChange={e => setUrl(e.target.value)} 
            placeholder="https://script.google.com/macros/s/.../exec" 
            className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
          />
          <button onClick={save} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow whitespace-nowrap">
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-400">Want to make sure it works?</span>
          <button onClick={testConnection} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200">
            Send Test Row
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass }) });
    const data = await res.json();
    if (res.ok) onLogin(data.token);
    else setErr('Invalid password');
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🎨</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Workshop Manager</h1>
          <p className="text-slate-400 text-sm">Please sign in to continue</p>
        </div>
        {err && <div className="mb-4 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl">{err}</div>}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Access Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} autoFocus className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Sign In</button>
      </form>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(getAuthToken());
  const [page, setPage] = useState('dashboard');
  const [shouldLogin, setShouldLogin] = useState(false);

  useEffect(() => {
    // Ping to check if auth is required
    fetch(`${API}/clients`).then(r => {
      if (r.status === 401) setShouldLogin(true);
    });
  }, []);

  if (shouldLogin && !token) {
    return <Login onLogin={(t) => { setAuthToken(t); setToken(t); setShouldLogin(false); }} />;
  }

  const pages = { dashboard: <Dashboard setPage={setPage} />, clients: <Clients />, workshops: <Workshops />, registrations: <Registrations />, payments: <Payments />, export: <Export />, settings: <Settings /> };
  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 overflow-auto">{pages[page]}</main>
    </div>
  );
}
