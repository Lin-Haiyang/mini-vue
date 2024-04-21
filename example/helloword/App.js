import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      'div',
      { 
        id: 'box',
        onClick() {
          console.log('click')
        },
        onMousedown() {
          console.log('onMousedown')
        }
      },
      [
        h('div', {class: 'parent'}, 'mini-vue ' + this.msg), 
        h(Foo, {count: 1, age: 18})
      ]
      // 'mini-vue ' + this.msg
      // [
      //   h('p', { class: 'red' }, '红色'),
      //   h('p', { class: 'blue' }, '蓝色'),
      //   h('p', { class: 'green' }, '绿色')
      // ]
    );
  },

  setup() {
    return {
      msg: 'hello'
    }
  }
}

