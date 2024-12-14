import Utils from '../utils/utils';

const container = document.getElementById('logs')!;
const logsTruncate = parseInt(container.dataset.truncate ?? '0', 10);
const logElements: Record<string, HTMLElement> = {};
const eventSource = new EventSource('/logs/data');

for (const child of container.children) {
  const logElement = child as HTMLElement;
  const id = logElement.dataset.id!;
  logElements[id] = logElement;
}

eventSource.onmessage = (ev) => {
  const [event, id, ...message] = (ev.data as string).split(':');

  if (event === 'ADD') {
    const logElement = document.createElement('span');
    logElement.textContent = message.join(':').replaceAll('\\n', '\n') + '\n';
    container.appendChild(logElement);
    truncateLogs();
    logElements[id] = logElement;
    scrollToBottom();
  } else if (event === 'REPLACE') {
    const logElement = logElements[id];
    if (logElement) {
      logElement.textContent = message.join(':').replaceAll('\\n', '\n') + '\n';
    }
  }
};

const truncateLogs = () => {
  while (container.childElementCount > logsTruncate) {
    container.removeChild(container.firstElementChild!);
  }
};

const scrollToBottom = Utils.throttle(() => {
  container.scrollTop = container.scrollHeight;
}, 20);

scrollToBottom();
