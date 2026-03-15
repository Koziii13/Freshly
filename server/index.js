const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'] }));

// API Routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/workshops', require('./routes/workshops'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));

// Serve React build
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Workshop Manager running at http://localhost:${PORT}`);
});
