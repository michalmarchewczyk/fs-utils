import { type UnknownObject } from 'express-handlebars/types';
import type * as handlebars from 'handlebars';

const helpers: UnknownObject = {
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
      case 'startsWith':
        return v1.startsWith(v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },
};

export default helpers;
