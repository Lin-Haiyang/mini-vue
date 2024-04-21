import { h, createTextVNode } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: 'App',
  render() {
    return h(
      'div',
      { 
        class: 'box',
      },
      [
        h('div', {class: 'parent'}, 'App' + this.msg), 
        h(Foo, {}, {
          header: (age) => [
            h('p', {}, 'header age:' + age), 
            createTextVNode('你好啊')
          ],
          footer: (name) => h('p', {}, 'footer name:' + name)
        })
      ]
    );
  },

  setup() {
    return {
      msg: 'hello'
    }
  }
}

