class EnhancedForm {
  constructor(
    private readonly enhancer: Enhancer,
    private readonly form: HTMLFormElement,
  ) {
    this.form.addEventListener('submit', async (e) => this.onSubmit(e));
    this.form.addEventListener('input', () => {
      this.onChanged();
    });
    this.form.addEventListener('change', () => {
      this.onChanged();
    });
  }

  private onChanged(changed = true) {
    this.form.querySelectorAll<HTMLElement>('[data-enh-changed]').forEach((element) => {
      if (changed) {
        this.enhancer.enableElement(element);
      } else {
        this.enhancer.disableElement(element);
      }
    });
  }

  private async onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const method = this.form.getAttribute('method') ?? 'GET';
    let url = this.form.getAttribute('action') ?? '';

    if (method === 'GET') {
      const query = new URLSearchParams();
      for (const [key, value] of formData) {
        query.append(key, value as string);
      }

      url += `?${query.toString()}`;
    }

    this.form.querySelectorAll<HTMLElement>('[data-enh-loading]').forEach((element) => {
      this.enhancer.enableElement(element);
    });
    this.form.querySelectorAll<HTMLElement>('[data-enh-ready]').forEach((element) => {
      this.enhancer.disableElement(element);
    });

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
      window.location.reload();
      return;
    }

    this.form.querySelectorAll<HTMLElement>('[data-enh-loading]').forEach((element) => {
      this.enhancer.disableElement(element);
    });
    this.form.querySelectorAll<HTMLElement>('[data-enh-ready]').forEach((element) => {
      this.enhancer.enableElement(element);
    });
    this.onChanged(false);
  }
}

class Enhancer {
  private static readonly prefix = 'enh-';
  private static readonly displayDisableClassList = ['d-none'];
  private readonly forms: EnhancedForm[] = [];

  public init() {
    this.initForms();
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
}

const enhancer = new Enhancer();
enhancer.init();
