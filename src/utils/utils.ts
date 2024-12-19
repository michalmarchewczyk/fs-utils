export default class Utils {
  public static humanizeSize(size: number, si = true, dp = 2): string {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(size) < thresh) {
      return size + ' B';
    }

    const units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
      size /= thresh;
      u += 1;
    } while (Math.round(Math.abs(size) * r) / r >= thresh && u < units.length - 1);

    return size.toFixed(dp) + units[u];
  }

  public static throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
    let inThrottle: boolean;
    let lastArgs: Parameters<T> | null;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        inThrottle = true;
        func(...args);
        setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            func(...lastArgs);
            lastArgs = null;
          }
        }, limit);
      } else {
        lastArgs = args;
      }
    }) as T;
  }

  public static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
