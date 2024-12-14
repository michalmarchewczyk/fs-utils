import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type VariablesConsumer from './variables-consumer';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type Variable = {
  name: string;
  value: string;
};

export default class VariablesManager {
  private static instance: VariablesManager;
  public loaded = false;
  private readonly filePath = path.join(__dirname, './data/vars.json');
  private readonly consumers: VariablesConsumer[] = [];

  public static getInstance() {
    if (!VariablesManager.instance) {
      VariablesManager.instance = new VariablesManager();
    }
    return VariablesManager.instance;
  }

  private constructor() {}

  public async saveToFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const data = JSON.stringify(this.variables, null, 2);
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
      const variables = JSON.parse(data) as Variable[];

      this.variables = [];
      for (const variable of variables) {
        this.variables.push(variable);
      }

      this.loaded = true;
    } catch (e) {
      throw new Error('Error loading variables from file');
    }
  }

  addConsumer(consumer: VariablesConsumer) {
    this.consumers.push(consumer);
  }

  public variables: Variable[] = [];

  public addVariable(name: string, value: string) {
    this.variables.push({ name, value });
    void this.saveToFile();
  }

  public getVariable(name: string) {
    return this.variables.find((variable) => variable.name === name)?.value;
  }

  public setVariable(name: string, value: string) {
    const variable = this.variables.find((variable) => variable.name === name);
    if (variable) {
      variable.value = value;
    } else {
      this.addVariable(name, value);
    }
    void this.saveToFile();
  }

  public addIfNotExists(name: string, value: string) {
    if (!this.variables.find((variable) => variable.name === name)) {
      this.addVariable(name, value);
    }
  }

  public clearVariables() {
    const usedVariableNames = this.consumers.flatMap((consumer) => consumer.variableNames);
    this.variables = this.variables.filter((variable) => usedVariableNames.includes(variable.name));
    void this.saveToFile();
  }
}
