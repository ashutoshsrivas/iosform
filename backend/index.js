const express = require('express');
const cors = require('cors');
const path = require('path');
const { createPoolAndMigrate } = require('./db');
const buildApplicationsRouter = require('./routes/applications');

const PORT = process.env.PORT || 4000;

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'https://iosdc.geu.ac.in',
];

function buildCors() {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const origins = [...new Set([...DEFAULT_ORIGINS, ...envOrigins])];

  return cors({
    origin: (origin, callback) => {
      // Allow same-origin or non-browser requests (no origin header)
      if (!origin || origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  });
}

async function start() {
  const app = express();
  app.use(buildCors());
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
