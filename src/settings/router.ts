import express from 'express';
import Settings, { type SettingDto } from './settings';
import CopyFileQueue from '../sync/copy-file-queue';
import { getState } from '../state';

// eslint-disable-next-line new-cap
const router = express.Router();

const settings = Settings.getInstance();

router.get('/', async (req, res) => {
  res.render('settings', { state: getState() });
});

router.post('/', async (req, res) => {
  const dto = req.body as SettingDto;
  settings.fromDto(dto);
  res.json({ success: true });
});

const copyFileQueue = CopyFileQueue.getInstance();

settings.on('change', async (key: string, value: number) => {
  if (key === 'maxConcurrency') {
    copyFileQueue.setMaxConcurrency(value);
  }
});

export default router;
