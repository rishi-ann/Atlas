const express = require('express');
const securityMiddleware = require('./middleware/security');

const app = express();
const PORT = 3005;

app.use(express.json());

// Apply SecureAuth Monitoring Middleware
app.use(securityMiddleware);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Global Banking Core operational.',
    security: 'SecureAuth AI Monitoring Active'
  });
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  console.log(`[Banking] Login attempt for: ${username}`);
  res.json({ success: true, message: 'Authentication process initiated.' });
});

app.listen(PORT, () => {
  console.log(`\x1b[32m[Atlas Playground] Banking App running on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[36m[SecureAuth] Monitoring platform: 75f2dd70-c5b6-4283-87b3-ec391d4cdc38\x1b[0m`);
});
