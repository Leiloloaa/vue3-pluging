import { Lazyload } from 'vant';
import Lazy from './Lazy.vue';

const isSupportWebp = (() => {
  try {
    return document.createElement('canvas').toDataURL('image/webp', 0.5).startsWith('data:image/webp');
  } catch {
    return false;
  }
})();
const suffix = '?x-oss-process=image/format,webp/quality,Q_80'
const webp = (binding: any) => { return isSupportWebp && /webp$/.test(binding.value) && binding.modifiers.webp }
function handleSrc(el: any, binding: any) {
  const handleError = () => {
    console.info('图片报错了===', binding.value)
    // 执行与指令值绑定的表达式
    el.src = binding.value;
    el.removeEventListener('error', handleError)
  }
  if (!el._hasLazyListener) {
    el.addEventListener('error', handleError);
    el._hasLazyListener = true; // 标记事件已添加
  }
  el.src = webp(binding) ? binding.value + suffix : binding.value
}
function handleBg(el: any, binding: any) {
  el.style.backgroundImage = `url('${webp(binding) ? binding.value + suffix : binding.value}')`
  el.style.backgroundSize = '100% 100%'
}
function handle(el: any, binding: any) {
  return binding.modifiers.bg ? handleBg(el, binding) : handleSrc(el, binding)
}
export const lazyBody = {
  beforeMount(el: any, binding: any) {
    el._hasLazyListener = false; // 标记事件是否已添加
    function observeImage() {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          // 当元素可见时加载图片并停止观察
          if (entry.isIntersecting) {
            handle(el, binding)
            observer.unobserve(el); // 图片加载后停止观察
          }
        });
      }, { threshold: 0 });
      // 观察指令绑定的元素
      observer?.observe(el);
    }

    // 判断 IntersectionObserver 是否可用
    if (window.IntersectionObserver) {
      observeImage();
    } else {
      // 不支持IntersectionObserver，立即加载图片
      handle(el, binding)
    }
  },
  updated(el: any, binding: any) {
    handle(el, binding) // 重新赋值（更新）binding.value
  },
};

export default (app: any) => {
  app.use(Lazyload, {
    lazyComponent: true,
  });
  if (app._context.directives['lazy']) {
    delete app._context.directives['lazy'];
  }
  app.directive('lazy', lazyBody);
  app.component('Lazy', Lazy);
};