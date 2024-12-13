import VariablesConsumer from './variables-consumer';

export default class DynamicString extends VariablesConsumer {
  protected variableInitialValue = '';
  private static readonly variableRegex = /\[([a-zA-Z0-9_]+)\]/g;

  constructor(public value: string) {
    const variableNames = DynamicString.getVariableNames(value);
    super(variableNames);
  }

  private static getVariableNames(value: string): string[] {
    return [...value.matchAll(DynamicString.variableRegex)].map((v) => v[1]);
  }

  public get() {
    return this.value.replace(
      DynamicString.variableRegex,
      (_, variableName: string) => this.variablesManager.getVariable(variableName) ?? this.variableInitialValue,
    );
  }

  public getRaw() {
    return this.value;
  }

  public set(value: string) {
    this.value = value;
    const variableNames = DynamicString.getVariableNames(value);
    this.refreshVariables(variableNames);
  }
}
