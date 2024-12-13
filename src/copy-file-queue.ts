import ProcessingQueue from './processing-queue';
import { copyFile } from 'copy-file';
import Utils from './utils';
import Logger from './logger';
import { type Stats } from 'node:fs';
const logger = Logger.getInstance();

export type CopyFileQueueItem = {
  source: string;
  destination: string;
  stat?: Stats;
};

export default class CopyFileQueue extends ProcessingQueue<CopyFileQueueItem> {
  protected maxConcurrency = 20;
  private static instance: CopyFileQueue;

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
    const bar = `[${'#'.repeat(barFill)}${'-'.repeat(barLength - barFill)}]`;
    return `\n${header}\n${progress} ${written !== 0 || done ? bar : ''}`;
  }

  protected async processItem({ source, destination, stat }: CopyFileQueueItem) {
    return new Promise<void>((resolve, reject) => {
      const log = logger.log(CopyFileQueue.getLogMessage(source, destination, 0, stat?.size ?? 0));
      const replace = Utils.throttle((id: string, msg: string) => logger.replaceLog(id, msg), 200);
      copyFile(source, destination, {
        onProgress(info) {
          replace(log, CopyFileQueue.getLogMessage(source, destination, info.writtenBytes, info.size));
        },
      })
        .then(() => {
          replace(log, CopyFileQueue.getLogMessage(source, destination, stat?.size, stat?.size, true));
          resolve();
        })
        .catch((e) => {
          replace(log, `Error: ${e.message}`);
          reject(e);
        });
    });
  }

  public setMaxConcurrency(max: number) {
    this.maxConcurrency = max;
  }
}
