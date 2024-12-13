import VariablesManager from './variables-manager';

export default abstract class VariablesConsumer {
  protected readonly variablesManager: VariablesManager;
  protected abstract variableInitialValue: string;

  protected constructor(variableNames: string[]) {
    this.variablesManager = VariablesManager.getInstance();
    this.refreshVariables(variableNames);
  }

  protected refreshVariables(variableNames: string[]) {
    variableNames.forEach((variable) => {
      this.variablesManager.addIfNotExists(variable, this.variableInitialValue);
    });
  }
}
