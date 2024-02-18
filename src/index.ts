import express from 'express';
import { create } from 'express-handlebars';
import path from 'node:path';
import Settings, { type SettingDto } from './settings';
import type * as handlebars from 'handlebars';
import multer from 'multer';
import { ServerResponse } from 'node:http';
import SyncManager from './sync-manager';
import SyncRecord, { type SyncRecordDto } from './sync-record';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Logger from './logger';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const hbs = create({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  },
  helpers: {
    switch(value: string, options: handlebars.HelperOptions) {
      this.switch_value = value;
      return options.fn(this);
    },
    case(value: string, options: handlebars.HelperOptions) {
      if (value === this.switch_value) {
        return options.fn(this);
      }
    },
    ifCond(v1: string, operator: string, v2: string, options: handlebars.HelperOptions) {
      switch (operator) {
        case '===':
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case '!==':
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case '<':
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case '<=':
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case '>':
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case '>=':
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case '&&':
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case '||':
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', 'src/views');

app.use((req, res, next) => {
  if (req.method === 'GET' || req.headers['x-enhanced-form']) {
    next();
    return;
  }

  req.headers['x-enhanced-form'] = 'true';

  const req2 = { ...req } as express.Request;
  const res2 = new ServerResponse(req);
  app(req2, res2);

  req.method = 'GET';
  next();
});

const settings = Settings.getInstance();
void settings.createFile().then(() => {
  console.log('Initialized settings file');
});
const syncManager = SyncManager.getInstance();
void syncManager.createFile().then(() => {
  console.log('Initialized sync file');
});

const logger = Logger.getInstance();

const getState = () => ({
  settings,
  settingsList: settings.toDto(),
  syncRecords: syncManager.records,
  logs: logger.getLogs(settings.logsTruncate),
  logsHtml: logger.toHtml(settings.logsTruncate),
});

app.get('/partials/:name', (req, res) => {
  res.render(`partials/${req.params.name}`, { layout: false, state: getState() });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer().none());
app.use('/css', express.static(path.join(__dirname, './css/')));
app.use('/scripts', express.static(path.join(__dirname, './scripts/')));

app.get('/', (req, res) => {
  res.render('home');
});

const settingsMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (!Settings.loaded) {
      await settings.loadFromFile();
    }
  } catch (e: any) {
    res.render('error', { error: e.message as string });
    return;
  }

  next();
};

app.get('/logs', settingsMiddleware, (req, res) => {
  res.render('logs', { state: getState() });
});

app.get('/logs/data', (req, res) => {
  const stream = logger.getLogsStream();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  stream.pipe(res);
});

app.get('/settings', settingsMiddleware, async (req, res) => {
  res.render('settings', { state: getState() });
});

app.post('/settings', settingsMiddleware, async (req, res) => {
  const dto = req.body as SettingDto;
  settings.fromDto(dto);
  res.json({ success: true });
});

app.get('/sync/record/:id', async (req, res) => {
  const record = syncManager.getRecord(req.params.id);
  const rendered = await hbs.render('src/views/partials/sync-record.handlebars', {
    layout: false,
    ...record,
    parentFolder: record?.parentFolder,
  });
  res.send(rendered);
});

app.get('/sync', async (req, res) => {
  try {
    if (!syncManager.loaded) {
      await syncManager.loadFromFile();
    }
  } catch (e: any) {
    res.render('error', { error: e.message as string });
    return;
  }

  res.render('sync', { state: getState() });
});

app.get('/sync/*', (req, res) => {
  res.redirect('/sync/');
});

app.post('/sync/create', async (req, res) => {
  const dto = req.body as SyncRecordDto;
  const record = SyncRecord.fromDto(dto);
  syncManager.addRecord(record);
  await syncManager.saveToFile();
  res.json({ success: true });
});

app.post('/sync/sync', async (req, res) => {
  const record = syncManager.getRecord(req.body.id as string);
  if (!record) {
    res.json({ success: false });
    return;
  }
  record.sync();
  res.json({ success: true });
});

app.post('/sync/update', async (req, res) => {
  const dto = req.body as SyncRecordDto;
  const record = SyncRecord.fromDto(dto);
  syncManager.replaceRecord(record);
  await syncManager.saveToFile();
  res.json({ success: true });
});

app.post('/sync/swap', async (req, res) => {
  const id = req.body.id as string;
  syncManager.swapRecord(id);
  await syncManager.saveToFile();
  res.json({ success: true });
});

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
