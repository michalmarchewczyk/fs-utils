import { randomUUID } from 'node:crypto';
import type fs from 'node:fs';
import chokidar from 'chokidar';
import globParent from 'glob-parent';
import CopyFileQueue from './copy-file-queue';
import DynamicString from '../variables/dynamic-string';
const copyFileQueue = CopyFileQueue.getInstance();

export type SyncRecordDto = {
  id?: string;
  from: string;
  to: string;
  autoSync: boolean;
  lastSync: string;
  description?: string;
  color?: string;
};

export default class SyncRecord {
  public id: string = randomUUID();
  public description = '';
  public color = '#ffffff';
  private _autoSync = false;
  public lastSync = new Date(0);
  private syncWatcher: chokidar.FSWatcher | null = null;

  constructor(
    public from: DynamicString,
    public to: DynamicString,
    autoSync = false,
  ) {
    this.autoSync = autoSync;
  }

  public get autoSync() {
    return this._autoSync;
  }

  public set autoSync(value: boolean) {
    this._autoSync = value;
    this.stopAutoSync();
    if (value) {
      this.startAutoSync();
    }
  }

  syncOnce() {
    const parentFolder = globParent(this.from.get());
    const watcher = chokidar.watch(this.from.get(), { persistent: false, usePolling: true });
    watcher.on('all', (event, path, stat) => {
      this.syncFile(path, parentFolder, stat);
    });
    watcher.on('ready', async () => {
      await watcher.close();
    });
  }

  startAutoSync() {
    if (!this.autoSync || this.syncWatcher) {
      return;
    }
    const parentFolder = globParent(this.from.get());
    this.syncWatcher = chokidar.watch(this.from.get(), { persistent: true, ignoreInitial: true, usePolling: true });
    this.syncWatcher.on('all', (event, path, stat) => {
      if (event === 'unlink' || event === 'unlinkDir') {
        return;
      }
      this.syncFile(path, parentFolder, stat);
    });
  }

  stopAutoSync() {
    if (this.syncWatcher) {
      void this.syncWatcher.close();
      this.syncWatcher = null;
    }
  }

  private syncFile(path: string, parentFolder: string, stat?: fs.Stats) {
    this.lastSync = new Date();
    const copyFrom = path.replaceAll('\\', '/');
    const relativePath = copyFrom.replace(parentFolder, '');
    const isDirectory = stat?.isDirectory() ?? false;
    const copyTo = this.to.get().replaceAll('\\', '/') + relativePath;
    if (isDirectory) {
      return;
    }
    copyFileQueue.add({ source: copyFrom, destination: copyTo, stat });
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
      color: this.color,
    };
  }

  static fromDto(dto: SyncRecordDto): SyncRecord {
    const syncRecord = new SyncRecord(new DynamicString(dto.from), new DynamicString(dto.to), dto.autoSync);
    syncRecord.lastSync = new Date(dto.lastSync ?? 0);
    syncRecord.id = dto.id ?? randomUUID();
    syncRecord.description = dto.description ?? '';
    syncRecord.color = dto.color ?? '#ffffff';
    return syncRecord;
  }
}
