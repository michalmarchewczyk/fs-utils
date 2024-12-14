import express from 'express';
import { getState } from '../state';
import Logger from './logger';

// eslint-disable-next-line new-cap
const router = express.Router();

const logger = Logger.getInstance();

router.get('/', (req, res) => {
  res.render('logs', { state: getState() });
});

router.get('/data', (req, res) => {
  const stream = logger.getLogsStream();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  stream.pipe(res);
});

export default router;
