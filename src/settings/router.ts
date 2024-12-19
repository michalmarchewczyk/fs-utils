import express from 'express';
import Settings, { type SettingDto } from './settings';
import CopyFileQueue from '../sync/copy-file-queue';
import { getState } from '../state';
import AmdZip from 'adm-zip';
import VariablesManager from '../variables/variables-manager';
import SyncManager from '../sync/sync-manager';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-disable-next-line new-cap
const router = express.Router();

const settings = Settings.getInstance();
const variablesManager = VariablesManager.getInstance();
const syncManager = SyncManager.getInstance();

router.get('/', async (req, res) => {
  res.render('settings', { state: getState() });
});

router.post('/', async (req, res) => {
  const dto = req.body as SettingDto;
  settings.fromDto(dto);
  res.json({ success: true });
});

router.post('/backup', async (req, res) => {
  const settingsPath = await settings.getPathForBackup();
  const variablesPath = await variablesManager.getPathForBackup();
  const syncPath = await syncManager.getPathForBackup();
  const zip: AmdZip = new AmdZip();
  zip.addLocalFile(settingsPath);
  zip.addLocalFile(variablesPath);
  zip.addLocalFile(syncPath);
  const zipName = `fs-utils_backup_${Date.now()}.zip`;
  const pathName = path.join(__dirname, `./data/backups/${zipName}`);
  zip.writeZip(pathName);
  res.download(pathName);
});

const copyFileQueue = CopyFileQueue.getInstance();

settings.on('change', async (key: string, value: number) => {
  if (key === 'maxConcurrency') {
    copyFileQueue.setMaxConcurrency(value);
  }
});

export default router;
