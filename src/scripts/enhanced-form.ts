import type Enhancer from './enhancer';

export default class EnhancedForm {
  constructor(
    private readonly enhancer: Enhancer,
    public readonly form: HTMLFormElement,
  ) {
    this.form.addEventListener('submit', async (e) => this.onSubmit(e));
    this.form.addEventListener('input', () => this.onChanged());
    this.form.addEventListener('change', () => this.onChanged());
    this.init();
  }

  private init() {
    this.enhancer.disableSelector('changed', this.form);
    this.enhancer.enableSelector('ready', this.form);
    this.enhancer.disableSelector('loading', this.form);
  }

  public refresh() {
    this.init();
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
    const formReloadTags = this.form.getAttribute('data-enh-reload')?.split(' ') ?? [];
    const buttonReloadTags = e.submitter?.getAttribute('data-enh-reload')?.split(' ') ?? [];
    const reloadTags = [...formReloadTags, ...buttonReloadTags];

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
      window.location.reload();
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
