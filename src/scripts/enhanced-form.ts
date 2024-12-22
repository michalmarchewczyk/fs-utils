import type Enhancer from './enhancer';
import Utils from '../utils/utils';

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

    const isAttachment = res.headers.get('Content-Disposition')?.includes('attachment');

    if (isAttachment) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let fileName = res.headers.get('Content-Disposition')?.split('filename=')[1] ?? 'file';
      fileName = Utils.trim(fileName, '"');
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const isRedirect = res.redirected;

    if (isRedirect) {
      window.location.href = res.headers.get('Location') ?? res.url ?? '';
      return;
    }

    const isJson = res.headers.get('Content-Type')?.includes('application/json');

    if (!isJson) {
      window.location.reload();
      return;
    }

    const data = (await res.json()) as Record<string, unknown>;

    if (data.error) {
      for (const [key, value] of Object.entries(data.error) as Array<[string, string]>) {
        const field = this.form.querySelector<HTMLInputElement>(`[name="${key}"]`);
        if (field) {
          field.classList.add('is-invalid');
          let errorElement = field.nextElementSibling;
          if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
            errorElement = document.createElement('div');
            errorElement.classList.add('invalid-feedback');
          }
          errorElement.textContent = value;
          field.after(errorElement);
        }
      }
    }

    for (const tag of reloadTags) {
      this.enhancer.reloadTag(tag);
    }

    this.enhancer.enableSelector('ready', this.form);
    this.enhancer.disableSelector('loading', this.form);
    this.onChanged(false);
  }
}
