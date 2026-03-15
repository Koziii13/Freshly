const db = require('../db');

/**
 * Fires a webhook to Google Sheets (fire & forget).
 * @param {string} type - 'registration' | 'client' | 'workshop' | 'payment'
 * @param {object} payload - Data to send
 */
async function sendWebhook(type, payload) {
  try {
    const { data, error } = await db.from('settings').select('value').eq('key', 'webhook_url').single();
    if (error || !data || !data.value) return;
    
    fetch(data.value, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type, ...payload })
    }).catch(err => console.error('Webhook fetch error:', err));
  } catch (err) {
    console.error('Webhook db error:', err);
  }
}

module.exports = { sendWebhook };
