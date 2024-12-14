import express from 'express';
import { getState } from '../state';
import SyncRecord, { type SyncRecordDto } from './sync-record';
import SyncManager from './sync-manager';
import hbs from '../hbs';

// eslint-disable-next-line new-cap
const router = express.Router();

const syncManager = SyncManager.getInstance();

router.get('/record/:id', async (req, res) => {
  const record = syncManager.getRecord(req.params.id);
  const recordDto = record?.toDto();
  const rendered = await hbs.render('src/views/partials/sync-record.handlebars', {
    layout: false,
    ...recordDto,
    parentFolder: record?.parentFolder,
  });
  res.send(rendered);
});

router.get('/', async (req, res) => {
  res.render('sync', { state: getState() });
});

router.get('/*', (req, res) => {
  res.redirect('/sync/');
});

router.post('/create', async (req, res) => {
  const dto = req.body as SyncRecordDto;
  const record = SyncRecord.fromDto(dto);
  syncManager.addRecord(record);
  await syncManager.saveToFile();
  res.json({ success: true });
});

router.post('/sync', async (req, res) => {
  const record = syncManager.getRecord(req.body.id as string);
  if (!record) {
    res.json({ success: false });
    return;
  }
  record.syncNow();
  res.json({ success: true });
});

router.post('/update', async (req, res) => {
  const dto = req.body as SyncRecordDto;
  const record = SyncRecord.fromDto(dto);
  syncManager.replaceRecord(record);
  await syncManager.saveToFile();
  res.json({ success: true });
});

router.post('/delete', async (req, res) => {
  const id = req.body.id as string;
  syncManager.deleteRecord(id);
  await syncManager.saveToFile();
  res.json({ success: true });
});

router.post('/swap', async (req, res) => {
  const id = req.body.id as string;
  syncManager.swapRecord(id);
  await syncManager.saveToFile();
  res.json({ success: true });
});

export default router;
