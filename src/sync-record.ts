import { randomUUID } from 'node:crypto';
import chokidar from 'chokidar';
import globParent from 'glob-parent';
import { copyFile } from 'copy-file';
import Logger from './logger';
import Utils from './utils';
const logger = Logger.getInstance();

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
    const parentFolder = globParent(this.from);
    const watcher = chokidar.watch(this.from, { persistent: false });
    watcher.on('all', (event, path, stat) => {
      const copyFrom = path.replaceAll('\\', '/');
      const relativePath = copyFrom.replace(parentFolder, '');
      const isDirectory = stat?.isDirectory() ?? false;
      const copyTo = this.to.replaceAll('\\', '/') + relativePath;
      if (isDirectory) {
        return;
      }
      const log = logger.log(SyncRecord.getLogMessage(copyFrom, copyTo, 0, stat?.size ?? 0));
      const replace = Utils.throttle((id: string, msg: string) => logger.replaceLog(id, msg), 200);
      copyFile(copyFrom, copyTo, {
        onProgress(info) {
          replace(log, SyncRecord.getLogMessage(copyFrom, copyTo, info.writtenBytes, info.size));
        },
      })
        .then(() => {
          replace(log, SyncRecord.getLogMessage(copyFrom, copyTo, stat?.size, stat?.size, true));
        })
        .catch((e) => {
          replace(log, `Error: ${e.message}`);
        });
    });
    watcher.on('ready', async () => {
      await watcher.close();
    });
  }

  private static getLogMessage(from: string, to: string, written = 0, size = 0, done = false) {
    const header = `Copying ${from} to ${to}`;
    let percent = size ? Math.round((written / size) * 100) : 0;
    if (done) {
      percent = 100;
    }
    const progress = `(${Utils.humanizeSize(written)}/${Utils.humanizeSize(size)}) ${percent}%`;
    const barLength = Math.max(120 - progress.length, 10);
    const barFill = Math.round((barLength * percent) / 100);
    const bar = `[${'#'.repeat(barFill)}${'-'.repeat(barLength - barFill)}]`;
    return `${header}\n${progress} ${written !== 0 || done ? bar : ''}`;
  }

  get parentFolder() {
    return globParent(this.from);
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
