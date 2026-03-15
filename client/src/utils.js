export const getAuthToken = () => localStorage.getItem('workshop_auth_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('workshop_auth_token', token);
  else localStorage.removeItem('workshop_auth_token');
};

const API = `${window.location.origin}/api`;

export async function apiFetch(endpoint, options = {}) {
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

export const badge = { paid: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20', pending: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20', partial: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20' };
export const typeBadge = { acting: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20', painting: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20', healing: 'bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20', other: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20' };

export const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
export const fmtMoney = (n) => `EGP ${Number(n || 0).toLocaleString()}`;
