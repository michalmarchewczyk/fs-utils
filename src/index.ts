import express from 'express';
import path from 'node:path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getState, initState } from './state';
import settingsRouter from './settings/router';
import loggerRouter from './logger/router';
import syncRouter from './sync/router';
import varRouter from './variables/router';
import hbs from './hbs';
import getEnhancerMiddleware from './utils/enhancer-server';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

void initState();

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', 'src/views');

app.use(getEnhancerMiddleware(app));

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

app.use('/settings', settingsRouter);

app.use('/logs', loggerRouter);

app.use('/sync', syncRouter);

app.use('/var', varRouter);

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
