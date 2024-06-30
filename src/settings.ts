import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { EventEmitter } from 'node:events';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SettingDto = {
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number';
};

export default class Settings extends EventEmitter {
  private static instance: Settings;
  public static loaded = false;
  private static readonly filePath = path.join(__dirname, './data/settings.json');
  public oldPrefix = 'old';
  public saveLogs = true;
  public logsTruncate = 2000;
  public maxConcurrency = 20;

  public static getInstance() {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }

    return Settings.instance;
  }

  private constructor() {
    super();
  }

  public async saveToFile() {
    await fs.mkdir(path.dirname(Settings.filePath), { recursive: true });
    const data = JSON.stringify(this, null, 2);
    await fs.writeFile(Settings.filePath, data, { encoding: 'utf-8' });
  }

  public async createFile() {
    try {
      await fs.access(Settings.filePath);
    } catch (e) {
      await this.saveToFile();
    }
  }

  public async loadFromFile() {
    try {
      const data = await fs.readFile(Settings.filePath, { encoding: 'utf-8' });
      const settings = JSON.parse(data) as Settings;
      this.oldPrefix = settings.oldPrefix;
      this.saveLogs = settings.saveLogs;
      this.logsTruncate = settings.logsTruncate;
      this.maxConcurrency = settings.maxConcurrency;
      Settings.loaded = true;
      this.emit('change', 'oldPrefix', this.oldPrefix);
      this.emit('change', 'saveLogs', this.saveLogs);
      this.emit('change', 'logsTruncate', this.logsTruncate);
      this.emit('change', 'maxConcurrency', this.maxConcurrency);
    } catch (e) {
      throw new Error('Error loading settings from file');
    }
  }

  public toDto(): SettingDto[] {
    return [
      { key: 'oldPrefix', value: this.oldPrefix, type: 'string' },
      { key: 'saveLogs', value: this.saveLogs.toString(), type: 'boolean' },
      { key: 'logsTruncate', value: this.logsTruncate.toString(), type: 'number' },
      { key: 'maxConcurrency', value: this.maxConcurrency.toString(), type: 'number' },
    ];
  }

  public fromDto(dto: SettingDto | SettingDto[], save = true) {
    if (Array.isArray(dto)) {
      for (const setting of dto) {
        this.fromDto(setting, false);
      }
    } else {
      switch (dto.key) {
        case 'oldPrefix':
          this.oldPrefix = dto.value;
          break;
        case 'saveLogs':
          this.saveLogs = dto.value === 'true';
          break;
        case 'logsTruncate':
          this.logsTruncate = parseInt(dto.value, 10);
          break;
        case 'maxConcurrency':
          this.maxConcurrency = parseInt(dto.value, 10);
          break;
        default:
          throw new Error(`Unknown setting key ${dto.key}`);
      }
      this.emit('change', dto.key, dto.value);
    }

    if (save) {
      void this.saveToFile();
    }
  }
}
