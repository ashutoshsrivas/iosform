const express = require('express');
const cors = require('cors');
const path = require('path');
const { createPoolAndMigrate } = require('./db');
const buildApplicationsRouter = require('./routes/applications');

const PORT = process.env.PORT || 4000;

async function start() {
  const app = express();
  app.use(cors({ origin: 'http://localhost:3000' }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const pool = await createPoolAndMigrate();

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Healthcheck failed', error);
      res.status(500).json({ status: 'error', message: 'Database unavailable' });
    }
  });

  app.use('/api/applications', buildApplicationsRouter(pool));

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
