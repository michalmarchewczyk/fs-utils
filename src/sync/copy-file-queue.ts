import ProcessingQueue from '../utils/processing-queue';
import { copyFile } from 'copy-file';
import Utils from '../utils/utils';
import Logger from '../logger/logger';
import { type Stats } from 'node:fs';
import Settings from '../settings/settings';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = Logger.getInstance();

const settings = Settings.getInstance();

export type CopyFileQueueItem = {
  source: string;
  destination: string;
  stat?: Stats;
  preventRename?: boolean;
};

export default class CopyFileQueue extends ProcessingQueue<CopyFileQueueItem> {
  protected maxConcurrency = 20;
  private static instance: CopyFileQueue;
  private static readonly protectedPaths = [path.join(__dirname, './data/')];
  private renameCounter = 1;

  private constructor() {
    super();
  }

  public static getInstance() {
    if (!CopyFileQueue.instance) {
      CopyFileQueue.instance = new CopyFileQueue();
    }
    return CopyFileQueue.instance;
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
    const bar = `[${'#'.repeat(barFill)}${'-'.repeat(barLength - barFill)}] ${done ? 'Done' : ''}`;
    return `\n${header}\n${progress} ${written !== 0 || done ? bar : 'Starting...'}`;
  }

  protected onError(error: Error) {
    logger.log('Error: ' + error.message, 'error');
  }

  protected async processItem({ source, destination, stat, preventRename }: CopyFileQueueItem) {
    return new Promise<void>((resolve, reject) => {
      const log = logger.log(CopyFileQueue.getLogMessage(source, destination, 0, stat?.size ?? 0));
      const replace = Utils.throttle(
        (id: string, msg: string, final = false) => logger.replaceLog(id, msg, final),
        200,
      );
      for (const protectedPath of CopyFileQueue.protectedPaths) {
        if (path.normalize(source).startsWith(path.normalize(protectedPath))) {
          reject(new Error(`Source path is protected: ${source}`));
          return;
        }
      }
      copyFile(source, destination, {
        onProgress(info) {
          replace(log, CopyFileQueue.getLogMessage(source, destination, info.writtenBytes, info.size));
        },
      })
        .then(() => {
          replace(log, CopyFileQueue.getLogMessage(source, destination, stat?.size, stat?.size, true), true);
          resolve();
        })
        .catch((e) => {
          if (e.code === 'EBUSY' && !preventRename) {
            logger.log(`File is busy: ${destination}, attempting to rename`, 'error');
            const renamedDestination = destination + settings.oldPrefix + this.renameCounter;
            this.renameCounter += 1;
            fs.rename(destination, renamedDestination)
              .then(() => {
                logger.log(`Renamed to ${renamedDestination}`, 'info');
                this.add({ source, destination, stat, preventRename: true });
                resolve();
              })
              .catch((e) => {
                logger.log(`Failed to rename: ${e.message}`, 'error');
                reject(e);
              });
          } else {
            reject(e);
          }
        });
    });
  }

  public setMaxConcurrency(max: number) {
    this.maxConcurrency = max;
  }
}
