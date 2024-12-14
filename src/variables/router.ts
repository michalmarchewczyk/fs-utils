import { getState } from '../state';
import VariablesManager, { type Variable } from './variables-manager';
import express from 'express';
import hbs from '../hbs';

// eslint-disable-next-line new-cap
const router = express.Router();

const variablesManager = VariablesManager.getInstance();

router.get('/', async (req, res) => {
  res.render('var', { state: getState() });
});

router.get('/record/:name', async (req, res) => {
  const record = variablesManager.variables.find((v) => v.name === req.params.name);
  const rendered = await hbs.render('src/views/partials/var-record.handlebars', {
    layout: false,
    ...record,
  });
  res.send(rendered);
});

router.post('/update', async (req, res) => {
  const variable = req.body as Variable;
  variablesManager.setVariable(variable.name, variable.value);
  res.json({ success: true });
});

export default router;
