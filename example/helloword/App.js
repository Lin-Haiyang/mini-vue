import { h } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  render() {
    return h(
      'div',
      { id: 'box' },
      [
        h('p', { class: 'red' }, '红色'),
        h('p', { class: 'blue' }, '蓝色'),
        h('p', { class: 'green' }, '绿色')
      ]
    );
  },

  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}

