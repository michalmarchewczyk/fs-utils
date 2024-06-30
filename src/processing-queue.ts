export default abstract class ProcessingQueue<T> {
  private readonly queue: T[] = [];
  protected abstract maxConcurrency: number;
  private current = 0;

  protected abstract processItem(item: T): Promise<void>;

  public add(item: T) {
    this.queue.push(item);
    this.process();
  }

  public process() {
    if (this.current >= this.maxConcurrency) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.current += 1;
    const item = this.queue.shift()!;
    void this.processItem(item).finally(() => {
      this.current -= 1;
      this.process();
    });
  }
}
