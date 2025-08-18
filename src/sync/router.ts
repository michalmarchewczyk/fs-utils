import express from 'express';
import { getState } from '../state';
import SyncRecord, { type SyncRecordDto } from './sync-record';
import SyncManager from './sync-manager';
import hbs from '../hbs';
import Utils from '../utils/utils';

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
  record.syncOnce();
  await Utils.sleep(1000);
  res.json({ success: true });
});

router.post('/update', async (req, res) => {
  const dto = req.body as SyncRecordDto;
  const record = { ...dto, autoSync: req.body.autoSync === 'on' };
  syncManager.modifyRecord(record);
  await syncManager.saveToFile();
  res.json({ success: true });
});

router.post('/duplicate', async (req, res) => {
  const dto = {
    to: req.body.to as string,
    from: req.body.from as string,
    autoSync: req.body.autoSync === 'on',
    description: req.body.description as string,
    color: req.body.color as string,
  } as SyncRecordDto;
  const record = SyncRecord.fromDto(dto);
  syncManager.addRecord(record);
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

router.post('/moveup', async (req, res) => {
  const id = req.body.id as string;
  syncManager.moveRecordUp(id);
  await syncManager.saveToFile();
  res.json({ success: true });
});

router.post('/movedown', async (req, res) => {
  const id = req.body.id as string;
  syncManager.moveRecordDown(id);
  await syncManager.saveToFile();
  res.json({ success: true });
});

export default router;
