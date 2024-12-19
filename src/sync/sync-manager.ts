import SyncRecord, { type SyncRecordDto } from './sync-record';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class SyncManager {
  private static instance: SyncManager;
  public loaded = false;
  private static readonly filePath = path.join(__dirname, './data/sync.json');
  public records: SyncRecord[] = [];

  public static getInstance() {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }

    return SyncManager.instance;
  }

  private constructor() {}

  public async getPathForBackup() {
    await this.saveToFile();
    return SyncManager.filePath;
  }

  public async saveToFile() {
    await fs.mkdir(path.dirname(SyncManager.filePath), { recursive: true });
    const data = JSON.stringify(
      this.records.map((r) => r.toDto()),
      null,
      2,
    );
    await fs.writeFile(SyncManager.filePath, data, { encoding: 'utf-8' });
  }

  public async createFile() {
    try {
      await fs.access(SyncManager.filePath);
    } catch (e) {
      await this.saveToFile();
    }
  }

  public async loadFromFile() {
    try {
      const data = await fs.readFile(SyncManager.filePath, { encoding: 'utf-8' });
      const syncRecordsDtos = JSON.parse(data) as SyncRecordDto[];

      this.records = [];
      for (const syncRecordDto of syncRecordsDtos) {
        this.records.push(SyncRecord.fromDto(syncRecordDto));
      }

      this.loaded = true;
    } catch (e) {
      throw new Error('Error loading sync records from file');
    }
  }

  addRecord(record: SyncRecord) {
    this.records.push(record);
  }

  replaceRecord(newRecord: SyncRecord) {
    const record = this.records.find((r) => r.id === newRecord.id);
    if (!record) {
      throw new Error('Record not found');
    }
    Object.assign(record, newRecord);
  }

  swapRecord(id: string) {
    const record = this.records.find((r) => r.id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    [record.from, record.to] = [record.to, record.from];
  }

  deleteRecord(id: string) {
    const record = this.records.find((r) => r.id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    this.records = this.records.filter((r) => r.id !== id);
  }

  moveRecordUp(id: string) {
    const record = this.records.find((r) => r.id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    const index = this.records.indexOf(record);
    if (index === 0) {
      return;
    }
    this.records.splice(index, 1);
    this.records.splice(index - 1, 0, record);
  }

  moveRecordDown(id: string) {
    const record = this.records.find((r) => r.id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    const index = this.records.indexOf(record);
    if (index === this.records.length - 1) {
      return;
    }
    this.records.splice(index, 1);
    this.records.splice(index + 1, 0, record);
  }

  getRecord(id: string) {
    return this.records.find((r) => r.id === id);
  }
}
