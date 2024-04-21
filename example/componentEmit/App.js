import { h } from "../../lib/guide-mini-vue.esm.js";
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
        h(Foo, {
          onAdd(p1, p2) {
            console.log('onAdd', p1, p2)
          },
          onAddFoo(p1, p2) {
            console.log('onAddFoo', p1, p2)
          }
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

