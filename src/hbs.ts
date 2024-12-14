import { create } from 'express-handlebars';
import helpers from './utils/helpers';

const hbs = create({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  },
  helpers,
});

export default hbs;
