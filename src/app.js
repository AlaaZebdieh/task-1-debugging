import express from 'express';
import { router } from './routes/index.js';
import { AppError } from './lib/errors.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.use(router);

  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' } });
    }
    console.error('[unhandled]', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });

  return app;
}
