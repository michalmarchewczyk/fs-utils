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
import authRouter from './auth/router';
import hbs from './hbs';
import getEnhancerMiddleware from './utils/enhancer-server';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import session from 'express-session';
import * as crypto from 'node:crypto';
import authMiddleware from './auth/middleware';

const app = express();

app.use(
  session({
    secret: crypto.randomBytes(20).toString('hex'),
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'strict',
    },
  }),
);

void initState();

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', 'src/views');

app.use(getEnhancerMiddleware(app));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer().none());
app.use('/css', express.static(path.join(__dirname, './css/')));
app.use('/scripts', express.static(path.join(__dirname, './scripts/')));

app.get('/partials/:name', authMiddleware, (req, res) => {
  res.render(`partials/${req.params.name}`, { layout: false, state: getState() });
});

app.use('/auth', authRouter);

app.get('/', authMiddleware, (req, res) => {
  res.render('home');
});

app.use('/settings', authMiddleware, settingsRouter);

app.use('/logs', authMiddleware, loggerRouter);

app.use('/sync', authMiddleware, syncRouter);

app.use('/var', authMiddleware, varRouter);

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
