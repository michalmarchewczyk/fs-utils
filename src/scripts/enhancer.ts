import EnhancedForm from './enhanced-form';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    enhancerTags: Record<string, HTMLElement[]>;
  }
}

export default class Enhancer {
  private static readonly prefix = 'enh-';
  private static readonly displayDisableClassList = ['d-none'];
  private readonly forms: EnhancedForm[] = [];

  private static selectAll<T>(selector: string): T[] {
    let selected = [...document.querySelectorAll<HTMLElement>(selector)];
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe');
    for (const iframe of iframes) {
      selected = [...selected, ...iframe.contentWindow!.document.querySelectorAll<HTMLElement>(selector)];
    }
    return selected as T[];
  }

  private get tags(): Record<string, HTMLElement[]> {
    let tags = window.top?.enhancerTags;
    if (!tags) {
      if (window.top) {
        tags = {};
        window.top.enhancerTags = tags;
      }
    }
    return tags!;
  }

  public init() {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe');
    let loaded = 0;
    if (iframes.length === 0) {
      this.initForms();
      this.initTags();
      this.initIntervals();
      this.initFilters();
    }
    for (const iframe of iframes) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      iframe.addEventListener('load', () => {
        loaded += 1;
        if (loaded === iframes.length) {
          this.initForms();
          this.initTags();
          this.initIntervals();
          this.initFilters();
        }
      });
    }
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

  private initIntervals() {
    const elements = Enhancer.selectAll<HTMLElement>(`[data-${Enhancer.prefix}interval]`);
    for (const element of elements) {
      const interval = parseInt(element.getAttribute(`data-${Enhancer.prefix}interval`) ?? '0', 10);
      if (interval > 0) {
        setInterval(() => {
          this.reloadTag(element.getAttribute(`data-${Enhancer.prefix}tag`) ?? '');
        }, interval);
      }
    }
  }

  private initFilters() {
    let filters = Enhancer.selectAll<HTMLInputElement>(`[data-${Enhancer.prefix}filter-value]`).map((el) =>
      el.getAttribute(`data-${Enhancer.prefix}filter-value`),
    );
    filters = [...new Set(filters)];
    for (const filter of filters) {
      const valueEl = Enhancer.selectAll<HTMLInputElement>(`[data-${Enhancer.prefix}filter-value="${filter}"]`)[0];
      if (!valueEl) {
        continue;
      }
      valueEl.oninput = () => {
        const elements = Enhancer.selectAll<HTMLElement>(`[data-${Enhancer.prefix}filter="${filter}"]`);
        const values = valueEl.value.split('|');
        for (const element of elements) {
          if (values.length === 0 || (values.length === 1 && values[0] === '')) {
            this.enableElement(element);
            continue;
          }
          const elementValue = element.getAttribute(`data-${Enhancer.prefix}filter-content`) ?? '';
          if (values.some((v) => elementValue.toLowerCase().includes(v.toLowerCase()))) {
            this.enableElement(element);
          } else {
            this.disableElement(element);
          }
        }
      };
      valueEl.oninput(new Event('input'));
    }
  }

  private refreshFilters() {
    this.initFilters();
  }

  private initForms() {
    const forms = Enhancer.selectAll<HTMLFormElement>(`form[data-${Enhancer.prefix}form]`);
    for (const form of forms) {
      this.forms.push(new EnhancedForm(this, form));
    }
  }

  private refreshForms() {
    const formElements = Enhancer.selectAll<HTMLFormElement>(`form[data-${Enhancer.prefix}form]`);
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
    const tags = Enhancer.selectAll<HTMLElement>(`[data-${Enhancer.prefix}tag]`);
    for (const tag of tags) {
      const tagName = tag.getAttribute(`data-${Enhancer.prefix}tag`) ?? '';
      if (!this.tags[tagName]) {
        this.tags[tagName] = [];
      }
      this.tags[tagName].push(tag);
    }
  }

  private refreshTags() {
    const tagElements = Enhancer.selectAll<HTMLElement>(`[data-${Enhancer.prefix}tag]`);
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
            this.refreshFilters();
            this.refreshScrolls();
          })
          .catch((e) => {
            console.error('Error loading partial/content', e);
          });
      }
    }
  }

  private refreshScrolls() {
    const scrollElements = Enhancer.selectAll<HTMLElement>(`[data-${Enhancer.prefix}scroll]`);
    for (const element of scrollElements) {
      const scroll = element.getAttribute(`data-${Enhancer.prefix}scroll`) ?? '';
      if (scroll === 'down') {
        element.scrollTop = element.scrollHeight;
      }
    }
  }
}
