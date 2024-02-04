import { randomUUID } from 'node:crypto';

export type SyncRecordDto = {
  id?: string;
  from: string;
  to: string;
  autoSync: boolean;
  lastSync: string;
  description?: string;
};

export default class SyncRecord {
  public id: string = randomUUID();
  public description = '';
  public lastSync = new Date(0);

  constructor(
    public from: string,
    public to: string,
    public autoSync = false,
  ) {}

  sync() {
    this.lastSync = new Date();
  }

  toDto(): SyncRecordDto {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      autoSync: this.autoSync,
      lastSync: this.lastSync.toISOString(),
      description: this.description,
    };
  }

  static fromDto(dto: SyncRecordDto): SyncRecord {
    const syncRecord = new SyncRecord(dto.from, dto.to, dto.autoSync);
    syncRecord.lastSync = new Date(dto.lastSync ?? 0);
    syncRecord.id = dto.id ?? randomUUID();
    syncRecord.description = dto.description ?? '';
    return syncRecord;
  }
}
