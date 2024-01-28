import fs from 'node:fs/promises';
import path from 'node:path';

export type SettingDto = {
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number';
};

export default class Settings {
  public static loaded = false;
  private static readonly filePath = path.join(__dirname, './data/settings.json');
  public oldPrefix = 'old';
  public saveLogs = true;

  public async saveToFile() {
    await fs.mkdir(path.dirname(Settings.filePath), { recursive: true });
    const data = JSON.stringify(this);
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
      Settings.loaded = true;
    } catch (e) {
      throw new Error('Error loading settings from file');
    }
  }

  public toDto(): SettingDto[] {
    return [
      { key: 'oldPrefix', value: this.oldPrefix, type: 'string' },
      { key: 'saveLogs', value: this.saveLogs.toString(), type: 'boolean' },
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
        default:
          throw new Error(`Unknown setting key ${dto.key}`);
      }
    }

    if (save) {
      void this.saveToFile();
    }
  }
}
