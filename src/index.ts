import express from 'express';
import { create } from 'express-handlebars';
import path from 'node:path';
import Settings, { type SettingDto } from './settings';
import type * as handlebars from 'handlebars';

const app = express();

const hbs = create({
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
          // eslint-disable-next-line no-negated-condition
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
app.use(express.urlencoded({ extended: true }));

app.use('/css', express.static(path.join(__dirname, './css/')));

app.get('/', (req, res) => {
  res.render('home');
});

const settings = new Settings();
void settings.createFile().then(() => {
  console.log('Initialized settings file');
});

app.get('/settings', async (req, res) => {
  try {
    if (!Settings.loaded) {
      await settings.loadFromFile();
    }
  } catch (e: any) {
    res.render('error', { error: e.message as string });
    return;
  }

  res.render('settings', { settings: settings.toDto() });
});

app.post('/settings', async (req, res) => {
  const dto = req.body as SettingDto;
  settings.fromDto(dto);
  res.render('settings', { settings: settings.toDto() });
});

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
