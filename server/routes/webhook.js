const db = require('../db');

/**
 * Fires a webhook to Google Sheets (fire & forget).
 * @param {string} type - 'registration' | 'client' | 'workshop' | 'payment'
 * @param {object} payload - Data to send
 */
function sendWebhook(type, payload) {
  const webhook = db.prepare('SELECT value FROM settings WHERE key=?').get('webhook_url')?.value;
  if (!webhook) return;
  fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ type, ...payload })
  }).catch(err => console.error('Webhook error:', err));
}

module.exports = { sendWebhook };
