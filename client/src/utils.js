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

export const badge = { paid: 'bg-green-100 text-green-700 ring-1 ring-green-500/20', pending: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-500/20', partial: 'bg-orange-100 text-orange-700 ring-1 ring-orange-500/20' };
export const typeBadge = { acting: 'bg-purple-100 text-purple-700 ring-1 ring-purple-500/20', painting: 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20', healing: 'bg-teal-100 text-teal-700 ring-1 ring-teal-500/20', other: 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20' };

export const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
export const fmtMoney = (n) => `EGP ${Number(n || 0).toLocaleString()}`;
