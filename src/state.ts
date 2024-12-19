import Settings from './settings/settings';
import SyncManager from './sync/sync-manager';
import Logger from './logger/logger';
import VariablesManager from './variables/variables-manager';

const settings = Settings.getInstance();
const syncManager = SyncManager.getInstance();
const logger = Logger.getInstance();
const variablesManager = VariablesManager.getInstance();

let stateInitialized = false;

export const initState = async () => {
  if (stateInitialized) {
    return;
  }
  stateInitialized = true;

  void settings.createFile().then(() => {
    console.log('Initialized settings file');
    void settings.loadFromFile().then(() => {
      console.log('Loaded settings from file');
    });
  });

  void syncManager.createFile().then(() => {
    console.log('Initialized sync file');
    void syncManager.loadFromFile().then(() => {
      console.log('Loaded sync from file');
    });
  });

  void variablesManager.createFile().then(() => {
    console.log('Initialized vars file');
    void variablesManager.loadFromFile().then(() => {
      console.log('Loaded vars from file');
    });
  });
};

export const getState = () => ({
  settings,
  settingsList: settings.toDto(),
  syncRecords: syncManager.records.map((r) => ({ ...r.toDto(), parentFolder: r.parentFolder })),
  varRecords: variablesManager.variables.sort((a, b) => a.name.localeCompare(b.name)),
  logs: logger.getLogs(settings.logsTruncate),
  logsHtml: logger.toHtml(settings.logsTruncate),
});
