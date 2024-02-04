import SyncRecord, { type SyncRecordDto } from './sync-record';
import path from 'node:path';
import fs from 'node:fs/promises';

export default class SyncManager {
  private static instance: SyncManager;
  public loaded = false;
  private readonly filePath = path.join(__dirname, './data/sync.json');
  public records: SyncRecord[] = [];

  public static getInstance() {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }

    return SyncManager.instance;
  }

  private constructor() {}

  public async saveToFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const data = JSON.stringify(this.records, null, 2);
    await fs.writeFile(this.filePath, data, { encoding: 'utf-8' });
  }

  public async createFile() {
    try {
      await fs.access(this.filePath);
    } catch (e) {
      await this.saveToFile();
    }
  }

  public async loadFromFile() {
    try {
      const data = await fs.readFile(this.filePath, { encoding: 'utf-8' });
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

  getRecord(id: string) {
    return this.records.find((r) => r.id === id);
  }
}
