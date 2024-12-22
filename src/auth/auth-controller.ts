import * as crypto from 'node:crypto';
import Logger from '../logger/logger';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'node:path';
import fs from 'node:fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = Logger.getInstance();

export default class AuthController {
  private static instance: AuthController;
  private static readonly filePath = path.join(__dirname, './data/pwd.txt');
  private passwordSet = false;

  public static getInstance() {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }

    return AuthController.instance;
  }

  private constructor() {}

  public async setPassword(password: string): Promise<boolean> {
    logger.log('Setting password');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const data = hash + ':' + salt;
    await fs.writeFile(AuthController.filePath, data, { encoding: 'utf-8' });
    logger.log('Password set');
    return true;
  }

  public async checkPassword(password: string): Promise<boolean> {
    try {
      const data = await fs.readFile(AuthController.filePath, { encoding: 'utf-8' });
      const [hash, salt] = data.split(':');
      const newHash = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), newHash);
    } catch (e) {
      return false;
    }
  }

  public async checkPasswordSet(): Promise<boolean> {
    if (this.passwordSet) {
      return true;
    }
    try {
      await fs.access(AuthController.filePath);
      this.passwordSet = true;
      return true;
    } catch (e) {
      return false;
    }
  }
}
