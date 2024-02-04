import EnhancedForm from './enhanced-form';

export default class Enhancer {
  private static readonly prefix = 'enh-';
  private static readonly displayDisableClassList = ['d-none'];
  private readonly forms: EnhancedForm[] = [];
  private readonly tags: Record<string, HTMLElement[]> = {};

  public init() {
    this.initForms();
    this.initTags();
  }

  public enableElement(element: HTMLElement) {
    const modType = this.getElementModType(element);
    if (modType === 'state') {
      (element as any).disabled = false;
      return;
    }
    if (modType === 'display') {
      element.classList.remove(...Enhancer.displayDisableClassList);
      element.style.display = '';
    }
  }

  public disableElement(element: HTMLElement) {
    const modType = this.getElementModType(element);
    if (modType === 'state') {
      (element as any).disabled = true;
      return;
    }
    if (modType === 'display') {
      element.style.display = 'none';
    }
  }

  public enableSelector(selector: string, parent: HTMLElement = document.body) {
    parent.querySelectorAll<HTMLElement>(`[data-${Enhancer.prefix}${selector}]`).forEach((element) => {
      this.enableElement(element);
    });
  }

  public disableSelector(selector: string, parent: HTMLElement = document.body) {
    parent.querySelectorAll<HTMLElement>(`[data-${Enhancer.prefix}${selector}]`).forEach((element) => {
      this.disableElement(element);
    });
  }

  private getElementModType(element: HTMLElement) {
    if (element.hasAttribute(`data-${Enhancer.prefix}state`)) {
      return 'state';
    }
    return 'display';
  }

  private initForms() {
    const forms = document.querySelectorAll<HTMLFormElement>(`form[data-${Enhancer.prefix}form]`);
    for (const form of forms) {
      this.forms.push(new EnhancedForm(this, form));
    }
  }

  private refreshForms() {
    const formElements = document.querySelectorAll<HTMLFormElement>(`form[data-${Enhancer.prefix}form]`);
    for (const form of formElements) {
      if (!this.forms.find((f) => f.form === form)) {
        this.forms.push(new EnhancedForm(this, form));
      }
    }
    for (const form of this.forms) {
      if (![...formElements].find((f) => f === form.form)) {
        this.forms.splice(this.forms.indexOf(form), 1);
      }
    }
  }

  private initTags() {
    const tags = document.querySelectorAll<HTMLElement>(`[data-${Enhancer.prefix}tag]`);
    for (const tag of tags) {
      const tagName = tag.getAttribute(`data-${Enhancer.prefix}tag`) ?? '';
      if (!this.tags[tagName]) {
        this.tags[tagName] = [];
      }
      this.tags[tagName].push(tag);
    }
  }

  private refreshTags() {
    const tagElements = document.querySelectorAll<HTMLElement>(`[data-${Enhancer.prefix}tag]`);
    for (const element of tagElements) {
      const tagName = element.getAttribute(`data-${Enhancer.prefix}tag`) ?? '';
      if (!this.tags[tagName]) {
        this.tags[tagName] = [];
      }
      if (!this.tags[tagName].find((e) => e === element)) {
        this.tags[tagName].push(element);
      }
    }
    for (const tagName in this.tags) {
      if (!this.tags[tagName]) {
        this.tags[tagName] = [];
      }
    }
  }

  public reloadTag(tagName: string) {
    const elements = this.tags[tagName] ?? [];
    for (const element of elements) {
      let url = element.getAttribute(`data-${Enhancer.prefix}content`) ?? '';
      const partial = element.getAttribute(`data-${Enhancer.prefix}partial`) ?? '';
      if (partial) {
        url = `/partials/${partial}`;
      }
      if (url) {
        fetch(url)
          .then(async (res) => res.text())
          .then((html) => {
            element.innerHTML = html;
            this.refreshForms();
            this.refreshTags();
            this.forms.filter((f) => f.form.contains(element)).forEach((f) => f.refresh());
          })
          .catch((e) => {
            console.error('Error loading partial/content', e);
          });
      }
    }
  }
}
