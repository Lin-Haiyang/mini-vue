import { createVNode } from "./vnode";
import { render } from "./renderer";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先 vnode
      // component -> vnode
      // 所有的操作都会基于 vnode 进行操作
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    }
  };
}
