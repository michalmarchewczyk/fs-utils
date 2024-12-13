import { randomUUID } from 'node:crypto';
import chokidar from 'chokidar';
import globParent from 'glob-parent';
import CopyFileQueue from './copy-file-queue';
import DynamicString from './dynamic-string';
const copyFileQueue = CopyFileQueue.getInstance();

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
    public from: DynamicString,
    public to: DynamicString,
    public autoSync = false,
  ) {}

  sync() {
    this.lastSync = new Date();
    const parentFolder = globParent(this.from.get());
    const watcher = chokidar.watch(this.from.get(), { persistent: false });
    watcher.on('all', (event, path, stat) => {
      const copyFrom = path.replaceAll('\\', '/');
      const relativePath = copyFrom.replace(parentFolder, '');
      const isDirectory = stat?.isDirectory() ?? false;
      const copyTo = this.to.get().replaceAll('\\', '/') + relativePath;
      if (isDirectory) {
        return;
      }
      copyFileQueue.add({ source: copyFrom, destination: copyTo, stat });
    });
    watcher.on('ready', async () => {
      await watcher.close();
    });
  }

  get parentFolder() {
    return globParent(this.from.get());
  }

  toDto(): SyncRecordDto {
    return {
      id: this.id,
      from: this.from.getRaw(),
      to: this.to.getRaw(),
      autoSync: this.autoSync,
      lastSync: this.lastSync.toISOString(),
      description: this.description,
    };
  }

  static fromDto(dto: SyncRecordDto): SyncRecord {
    const syncRecord = new SyncRecord(new DynamicString(dto.from), new DynamicString(dto.to), dto.autoSync);
    syncRecord.lastSync = new Date(dto.lastSync ?? 0);
    syncRecord.id = dto.id ?? randomUUID();
    syncRecord.description = dto.description ?? '';
    return syncRecord;
  }
}
