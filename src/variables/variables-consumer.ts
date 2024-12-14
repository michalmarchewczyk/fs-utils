import VariablesManager from './variables-manager';

export default abstract class VariablesConsumer {
  protected readonly variablesManager: VariablesManager;
  protected abstract variableInitialValue: string;

  protected constructor(public variableNames: string[]) {
    this.variablesManager = VariablesManager.getInstance();
    this.variablesManager.addConsumer(this);
    this.refreshVariables();
  }

  protected refreshVariables() {
    this.variableNames.forEach((variable) => {
      this.variablesManager.addIfNotExists(variable, this.variableInitialValue);
    });
  }
}
