import { useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, apiFetch } from './utils';
import { Sidebar } from './components/Shared';

// Import Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Workshops from './pages/Workshops';
import Registrations from './pages/Registrations';
import Payments from './pages/Payments';
import Export from './pages/Export';
import Settings from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  const [token, setToken] = useState(getAuthToken());
  const [page, setPage] = useState('dashboard');
  const [shouldLogin, setShouldLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ping to check if auth is required
    apiFetch('/clients', { method: 'HEAD' })
      .then(r => {
        if (r.status === 401) setShouldLogin(true);
      })
      .catch((e) => {
        if (e.message === 'Unauthorized') setShouldLogin(true);
      })
      .finally(() => {
         setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🎨</div>
      </div>
    );
  }

  if (shouldLogin && !token) {
    return <Login onLogin={(t) => { setAuthToken(t); setToken(t); setShouldLogin(false); }} />;
  }

  const handleLogout = () => {
    setAuthToken(null);
    setToken(null);
    setShouldLogin(true);
  };

  const PageComponent = {
    dashboard: Dashboard,
    clients: Clients,
    workshops: Workshops,
    registrations: Registrations,
    payments: Payments,
    export: Export,
    settings: Settings
  }[page];

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-900 overflow-hidden font-sans">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} token={token} />
      <main className="flex-1 overflow-y-auto">
        {PageComponent && <PageComponent setPage={setPage} />}
      </main>
    </div>
  );
}
