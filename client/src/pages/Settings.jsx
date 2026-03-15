import { useState, useEffect } from 'react';
import { apiFetch } from '../utils';

export default function Settings() {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    apiFetch('/settings').then(r => r.json()).then(data => setUrl(data.webhook_url || ''));
  }, []);

  const save = async () => {
    setLoading(true);
    await apiFetch('/settings/webhook', { 
      method: 'POST', 
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify({ url }) 
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testConnection = async () => {
    if (!url) return setTestResult({ error: true, msg: 'Please enter and save a Webhook URL first.' });
    
    setTestResult({ loading: true, msg: 'Sending test ping via server...' });
    
    try {
      const resp = await apiFetch('/settings/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await resp.json();
      
      if (data.success) {
        setTestResult({ error: false, msg: 'Success! Look for a new row in your Google Sheet (LOGS or TEST tab).' });
      } else {
        setTestResult({ error: true, msg: `Failed. Server says: ${data.msg || 'Invalid URL'}` });
      }
    } catch (err) {
      setTestResult({ error: true, msg: 'Failed to connect to the local server to run the test.' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Workspace Settings</h1>
        <p className="text-slate-500 text-base">Configure integrations and data backups.</p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-slate-200/60 shadow-sm p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl ring-1 ring-green-100 shadow-sm">
            📊
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">Google Sheets Integration</h3>
            <p className="text-sm text-slate-500 font-medium">Auto-populate your spreadsheets using a webhook</p>
          </div>
        </div>

        <div className="pl-0 md:pl-16">
          <p className="text-[14px] text-slate-600 leading-relaxed mb-6 bg-slate-50/50 p-4 rounded-xl ring-1 ring-slate-100">
            Paste your Google Apps Script Webhook URL here. Every time you register a client for a workshop, we will automatically send that row to your live online Google Sheet as a backup, meaning you don't even need to use the Export button anymore.
          </p>

          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apps Script Webhook URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold p-1">🔗</span>
              <input 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://script.google.com/macros/s/..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
            </div>
            
            <button 
              onClick={save} 
              disabled={loading}
              className={`sm:w-32 py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center ${
                saved 
                  ? 'bg-green-500 text-white hover:bg-green-600 ring-green-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
              }`}
            >
              {loading ? <span className="animate-spin text-lg block h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : saved ? 'Saved ✓' : 'Save URL'}
            </button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Connection Diagnostics</h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-500">Not sure if your script is working correctly? Send a dummy payload to test it.</p>
              <button 
                onClick={testConnection} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ring-1 ring-slate-200 flex-shrink-0"
              >
                Send Test Row
              </button>
            </div>
            
            {testResult && (
              <div className={`mt-5 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 animate-in slide-up ${
                testResult.loading ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' :
                testResult.error ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-green-50 text-green-700 ring-1 ring-green-100'
              }`}>
                <span className="text-lg leading-none mt-0.5">
                  {testResult.loading ? '↻' : testResult.error ? '⚠️' : '✓'}
                </span>
                {testResult.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
