import Enhancer from './enhancer';

if (window === window.top) {
  const enhancer = new Enhancer();
  enhancer.init();
}
