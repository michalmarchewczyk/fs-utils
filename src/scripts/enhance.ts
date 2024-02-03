class EnhancedForm {
  constructor(
    private readonly enhancer: Enhancer,
    private readonly form: HTMLFormElement,
  ) {
    this.form.addEventListener('submit', async (e) => this.onSubmit(e));
    this.form.addEventListener('input', () => this.onChanged());
    this.form.addEventListener('change', () => this.onChanged());
  }

  private onChanged(changed = true) {
    if (changed) {
      this.enhancer.enableSelector('changed', this.form);
    } else {
      this.enhancer.disableSelector('changed', this.form);
    }
  }

  private async onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const method = this.form.getAttribute('method') ?? 'GET';
    let url = e.submitter?.getAttribute('formaction') ?? this.form.getAttribute('action') ?? '';
    const reloadTags = this.form.getAttribute('data-enh-reload')?.split(' ') ?? [];

    if (method === 'GET') {
      const query = new URLSearchParams();
      for (const [key, value] of formData) {
        query.append(key, value as string);
      }

      url += `?${query.toString()}`;
    }

    this.enhancer.disableSelector('ready', this.form);
    this.enhancer.enableSelector('loading', this.form);

    const res = await fetch(url, {
      method,
      body: method !== 'GET' ? formData : undefined,
      headers: {
        'X-Enhanced-Form': 'true',
      },
    });

    const isJson = res.headers.get('Content-Type')?.includes('application/json');

    const data = isJson ? ((await res.json()) as Record<string, unknown>) : await res.text();

    if (!isJson) {
      Window.location.reload();
      return;
    }

    for (const tag of reloadTags) {
      this.enhancer.reloadTag(tag);
    }

    this.enhancer.enableSelector('ready', this.form);
    this.enhancer.disableSelector('loading', this.form);
    this.onChanged(false);
  }
}

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

  public reloadTag(tagName: string) {
    const elements = this.tags[tagName] ?? [];
    for (const element of elements) {
      const partial = element.getAttribute(`data-${Enhancer.prefix}partial`) ?? '';
      if (partial) {
        fetch('/partials/' + partial)
          .then(async (res) => {
            console.log('res', res);
            return res.text();
          })
          .then((html) => {
            element.innerHTML = html;
          })
          .catch((e) => {
            console.error('Error loading partial', e);
          });
      }
    }
  }
}
