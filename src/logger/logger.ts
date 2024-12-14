import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type Log = {
  id: string;
  message: string;
  date: Date;
  type: 'info' | 'warning' | 'error';
};

export default class Logger extends EventEmitter {
  private static instance: Logger;
  public static readonly logToConsole = false;
  private static readonly filePath = path.join(
    __dirname,
    './data/logs/',
    new Date().toISOString().replace(/[:\-.T]/g, '-') + '.log',
  );

  public logs: Record<string, Log> = {};

  public static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private constructor() {
    super();
    void this.createFile();
  }

  private async saveToFile() {
    await fs.mkdir(path.dirname(Logger.filePath), { recursive: true });
    const data = '';
    await fs.writeFile(Logger.filePath, data, { encoding: 'utf-8' });
  }

  private async createFile() {
    try {
      await fs.access(Logger.filePath);
    } catch (e) {
      await this.saveToFile();
    }
  }

  private async appendToFile(log: Log) {
    const data = Logger.serializeLog(log) + '\n';
    await fs.appendFile(Logger.filePath, data, { encoding: 'utf-8' });
  }

  private static serializeLog(log: Log) {
    return `${log.date.toISOString()} [${log.type.toUpperCase()}] ${log.message}`;
  }

  private static serializeLogToHtml(log: Log) {
    return `<span data-id="${log.id}">${Logger.serializeLog(log)}</span>`;
  }

  public toHtml(truncate = 0) {
    return Object.values(this.logs)
      .map(Logger.serializeLogToHtml)
      .slice(-1 * truncate)
      .join('\n');
  }

  public getLogs(truncate = 0) {
    return Object.values(this.logs)
      .map(Logger.serializeLog)
      .slice(-1 * truncate)
      .join('\n');
  }

  public getLogsStream() {
    const stream = new Readable();
    stream._read = () => 0;
    this.on('log', (log: Log) => {
      stream.push(`data: ADD:${log.id}:` + Logger.serializeLog(log).replaceAll('\n', '\\n') + '\n\n');
    });
    this.on('replaceLog', (log: Log) => {
      stream.push(`data: REPLACE:${log.id}:` + Logger.serializeLog(log).replaceAll('\n', '\\n') + '\n\n');
    });
    return stream;
  }

  public log(message: string, type: 'info' | 'warning' | 'error' = 'info'): string {
    const log: Log = {
      id: randomUUID(),
      message,
      date: new Date(),
      type,
    };
    this.logs[log.id] = log;
    this.emit('log', log);
    void this.appendToFile(log);
    if (Logger.logToConsole) {
      console.log(Logger.serializeLog(log));
    }
    return log.id;
  }

  public replaceLog(id: string, newMessage: string) {
    const log = this.logs[id];
    if (!log) {
      throw new Error('Log not found');
    }
    log.message = newMessage;
    this.emit('replaceLog', log);
  }
}
